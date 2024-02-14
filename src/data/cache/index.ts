import { config } from '@/lib/config';
import { Logger as log } from '@/lib/logger';

import { createClient } from 'redis';
const Logger = new log(__filename);

const redisURL = `redis://localhost:6379`;
const URLFROMCONFIG = `redis://${config.redis.pass}@${config.redis.host}:${config.redis.port}`;


let constr =''

if (config.isDocker) {
  constr = 'redis://redis:6379';
} else {
  constr = redisURL;
}
// Logger.debug({
//    hardcoded: redisURL ,
//    fromEnv: URLFROMCONFIG ,
//    now: constr ,
  
// });
const client = createClient({ url: constr });

client.on('connect', () => Logger.info('Cache is connecting'));
client.on('ready', () => Logger.info('Cache is ready'));
client.on('end', () => Logger.info('Cache disconnected'));
client.on('reconnecting', () => Logger.info('Cache is reconnecting'));
client.on('error', (e) => Logger.error(e));

(async () => {
  await client.connect();
})();

// If the Node process ends, close the Cache connection
process.on('SIGINT', async () => {
  await client.disconnect();
});

export default client;

import { RedisClientType } from 'redis';
import { Key } from './keys';

// class RedisCache {
//   private static instance: RedisCache;
//   private client: RedisClientType;
//   private connectAttempts = 0;

//   constructor(private url: string) {
//     this.client = createClient({ url: this.url });
//     this.setupEventListeners();
//   }
//   public static getInstance(url: string): RedisCache {
//     if (!RedisCache.instance) {
//       RedisCache.instance = new RedisCache(url);
//     }
//     return RedisCache.instance;
//   }

//   private setupEventListeners(): void {
//     this.client.on('connect', () => Logger.info('Cache is connecting'));
//     this.client.on('ready', () => Logger.info('Cache is ready'));
//     this.client.on('end', () => Logger.info('Cache disconnected'));
//     this.client.on('reconnecting', () => Logger.info('Cache is reconnecting'));
//     this.client.on('error', (e) => {
//       Logger.error(e);
//       this.handleReconnect();
//     });
//   }

//   public async connect(): Promise<void> {
//     try {
//       await this.client.connect();
//       this.connectAttempts = 0; // Reset on successful connection
//     } catch (e) {
//       Logger.error('Failed to connect to Redis, attempting to reconnect...');
//       this.handleReconnect();
//     }
//   }

//   private async handleReconnect(): Promise<void> {
//     this.connectAttempts++;
//     const backoffTime = this.calculateExponentialBackoff(this.connectAttempts);
//     setTimeout(() => this.connect(), backoffTime);
//   }

//   private calculateExponentialBackoff(attempts: number): number {
//     const baseDelay = 10000; // Base delay in milliseconds
//     const maxDelay = 300000; // Max delay to prevent excessively long wait times
//     const backoff = Math.min(baseDelay * 2 ** attempts, maxDelay);
//     return backoff;
//   }

//   public async disconnect(): Promise<void> {
//     await this.client.disconnect();
//   }
//   public getClient(): RedisClientType {
//     return this.client;
//   }
// }

// export { RedisCache };


