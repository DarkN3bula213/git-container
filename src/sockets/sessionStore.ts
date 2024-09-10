import { RedisClientType } from 'redis'; // Assuming RedisClientType is from a Redis package
import { CacheClientService } from '../data/cache/cache.service';
import redisClient from '../data/cache/cache.client';
interface Session {
  userID: string;
  username: string;
  connected: boolean;
}

abstract class SessionStore {
  abstract findSession(id: string): Promise<Session | undefined>;
  abstract saveSession(id: string, session: Session): Promise<void>;
  abstract findAllSessions(): Promise<Session[]>;
}

class RedisSessionStore extends SessionStore {
  private cacheClient: CacheClientService;

  constructor(cacheClient: CacheClientService) {
    super();
    this.cacheClient = cacheClient;
  }

  async findSession(id: string): Promise<Session | undefined> {
    const sessionData = await this.cacheClient.get<Session>(`session:${id}`);
    return sessionData ? sessionData : undefined;
  }

  async saveSession(id: string, session: Session): Promise<void> {
    await this.cacheClient.setExp(`session:${id}`, session, 86400); // 86400 seconds = 1 day
  }

  async findAllSessions(): Promise<Session[]> {
    const keys = await this.cacheClient.getClient().keys('session:*');
    const sessions: Session[] = [];

    for (const key of keys) {
      const sessionData = await this.cacheClient.get<Session>(key);
      if (sessionData) {
        sessions.push(sessionData);
      }
    }

    return sessions;
  }

  async deleteSession(id: string): Promise<void> {
    await this.cacheClient.del(`session:${id}`);
  }
}

// Example usage of CacheClientService for other caching operations

export const cache = new CacheClientService(redisClient);

const sessionStore = new RedisSessionStore(cache);

// Example usage
(async () => {
  await cache.connect();

  // Save a session
  const sessionData: Session = {
    userID: '123',
    username: 'JohnDoe',
    connected: true,
  };
  await sessionStore.saveSession('session_123', sessionData);

  // Retrieve the session
  const session = await sessionStore.findSession('session_123');
  console.log('Session:', session);

  // Delete the session
  await sessionStore.deleteSession('session_123');

  await cache.disconnect();
})();
