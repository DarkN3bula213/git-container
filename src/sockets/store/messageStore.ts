import redisClient from '@/data/cache/cache.client';
import { CacheClientService } from '@/data/cache/cache.service';
import { ProductionLogger } from '@/lib/logger/v1/logger';

const logger = new ProductionLogger(__filename);
export interface Message {
	from: UserChat;
	to: UserChat;
	content: string;
	timestamp: number;
	conversationId?: string;
}
type UserChat = {
	userId: string;
	username: string;
	socketId: string;
};
// Abstract class to define the contract for message storage
abstract class MessageStore {
	abstract saveMessage(message: Message): Promise<void>;
	abstract findMessagesForUser(userID: string): Promise<Message[]>;
}

// In-memory message store for local development/testing
// class InMemoryMessageStore extends MessageStore {
//     private messages: Message[];

//     constructor() {
//         super();
//         this.messages = [];
//     }

//     async saveMessage(message: Message): Promise<void> {
//         this.messages.push(message);
//     }

//     async findMessagesForUser(userID: string): Promise<Message[]> {
//         return this.messages.filter(
//             ({ from, to }) => from.userId === userID || to.userId === userID
//         );
//     }
// }

const CONVERSATION_TTL = 24 * 60 * 60; // 1 day TTL for messages

// Redis message store that stores messages in Redis using CacheClientService
class RedisMessageStore extends MessageStore {
	private readonly cacheClient: CacheClientService;

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
			value
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
			results
		});
		// Parse and return the messages
		return results.map((result: string) => JSON.parse(result) as Message);
	}
}

const cacheService = new CacheClientService(redisClient);

export const messageSingleton = new RedisMessageStore(cacheService);
