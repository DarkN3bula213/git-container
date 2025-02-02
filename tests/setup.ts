import dotenv from 'dotenv';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { vi } from 'vitest';
import { app } from '../src/app';
import { cache } from '../src/data/cache/cache.service';
import { config } from '../src/lib/config';
import { Logger } from '../src/lib/logger';

const URI = `mongodb://${config.mongo.user}:${encodeURIComponent(config.mongo.pass)}@127.0.0.1:27017/docker-db?replicaSet=rs0`;
// import teardown from './teardown';
// import * as db from './tests.db';
// Mock the file system operations
 

let mockLogger: any;

dotenv.config({ path: './tests/.env.test' });
const replSet = new MongoMemoryReplSet({
	replSet: {
		count: 3, // Number of replica set members
		storageEngine: 'wiredTiger',
		name: 'testset'
	}
});
const request = supertest(app);
beforeAll(async () => {
	// Disconnect any existing connections
	await mongoose.disconnect();
	// await cache.getClient().quit();

	// Connect to the in-memory database
	await mongoose.connect(URI, {
		directConnection: true
	});

	// Connect to cache (assuming Redis)
	// await cache.getClient().connect();
});
afterEach(async () => {
	// Clear all mock logger calls
	vi.clearAllMocks();
	mockLogger.info('Test database cleared');
});
afterAll(async () => {
	await mongoose.disconnect();
	await cache.getClient().quit();
	await replSet.stop();
});

export { request };
