import { RedisClientType } from 'redis'; // Assuming RedisClientType is from a Redis package
import { CacheClientService } from '../data/cache/cache.service';
import redisClient from '../data/cache/cache.client';
import { Logger } from '../lib/logger';
const logger = new Logger(__filename);
interface Message {
  from: string;
  to: string;
  content: string;
  timestamp: number;
}

// Abstract class to define the contract for message storage
abstract class MessageStore {
  abstract saveMessage(message: Message): Promise<void>;
  abstract findMessagesForUser(userID: string): Promise<Message[]>;
}

// In-memory message store for local development/testing
class InMemoryMessageStore extends MessageStore {
  private messages: Message[];

  constructor() {
    super();
    this.messages = [];
  }

  async saveMessage(message: Message): Promise<void> {
    this.messages.push(message);
  }

  async findMessagesForUser(userID: string): Promise<Message[]> {
    return this.messages.filter(
      ({ from, to }) => from === userID || to === userID,
    );
  }
}

const CONVERSATION_TTL = 24 * 60 * 60; // 1 day TTL for messages

// Redis message store that stores messages in Redis using CacheClientService
class RedisMessageStore extends MessageStore {
  private cacheClient: CacheClientService;

  constructor(cacheClient: CacheClientService) {
    super();
    this.cacheClient = cacheClient;
  }

  async saveMessage(message: Message): Promise<void> {
    const messageKeyFrom = `messages:${message.from}`;
    const messageKeyTo = `messages:${message.to}`;
    const value = JSON.stringify(message);
    logger.debug({
      messageKeyFrom,
      messageKeyTo,
      value,
    });
    // Use the cache client to store messages in both sender and receiver's message list
    await this.cacheClient
      .getClient()
      .multi()
      .rPush(messageKeyFrom, value)
      .rPush(messageKeyTo, value)
      .expire(messageKeyFrom, CONVERSATION_TTL)
      .expire(messageKeyTo, CONVERSATION_TTL)
      .exec();
  }

  async findMessagesForUser(userID: string): Promise<Message[]> {
    const messageKey = `messages:${userID}`;

    // Retrieve the list of messages for the user
    const results = await this.cacheClient
      .getClient()
      .lRange(messageKey, 0, -1);
    logger.debug({
      messageKey,
      results,
    });
    // Parse and return the messages
    return results.map((result: string) => JSON.parse(result) as Message);
  }
}

// Example usage of CacheClientService for message store

const cacheService = new CacheClientService(redisClient);

const messageStore = new RedisMessageStore(cacheService);

// Example of saving and fetching messages
(async () => {
  await cacheService.connect();

  // Save a new message
  const message: Message = {
    from: 'user123',
    to: 'user456',
    content: 'Hello!',
    timestamp: Date.now(),
  };
  await messageStore.saveMessage(message);

  // Fetch messages for a user
  const messages = await messageStore.findMessagesForUser('user123');
  console.log('Messages for user123:', messages);

  await cacheService.disconnect();
})();
