# Progress logs

### Classes

1. Define all crud operations [+]
2. Write schemas for all write operations /: 
3. Write seeding functions
4. Write tests for all


# Students


import { createClient, RedisClientType } from 'redis';
import { Logger } from './Logger'; // Adjust the import path as necessary

class RedisCache {
  private static instance: RedisCache;
  private client: RedisClientType;
  private connectAttempts = 0;

  private constructor(private url: string) {
    this.client = createClient({ url: this.url });
    this.setupEventListeners();
  }

  public static getInstance(url: string): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache(url);
    }
    return RedisCache.instance;
  }

  private setupEventListeners(): void {
    // Event listeners as you defined them
  }

  public async connect(): Promise<void> {
    // Your connect method as defined
  }

  private async handleReconnect(): Promise<void> {
    // Your handleReconnect method as defined
  }

  private calculateExponentialBackoff(attempts: number): number {
    // Your calculateExponentialBackoff method as defined
  }

  public async disconnect(): Promise<void> {
    // Your disconnect method as defined
  }

  public getClient(): RedisClientType {
    return this.client;
  }
}


version: '3.7'

services:

  postgres:
    image: postgres:alpine
    environment:
      POSTGRES_PASSWORD: devpassword # Use secure passwords in production
    ports:
      - "5432:5432"

  redis:
    image: redis:alpine
    command: redis-server #--requirepass devpassword # Use secure passwords in production
    ports:
      - "6379:6379"

  mongo:
    image: mongo:latest
    command: mongod --auth
    environment:
      MONGO_INITDB_ROOT_USERNAME: devuser
      MONGO_INITDB_ROOT_PASSWORD: devpassword # Use secure passwords in production
    ports:
      - "27017:27017"