import dotenv from 'dotenv';
import supertest  from 'supertest';
import { app } from '../src/app';
import { Logger } from '../src/lib/logger/logger';
import * as db from './tests.db';

const logger = new Logger('TestSetup');
dotenv.config({ path: './tests/.env.test' });
let request;

beforeAll(async () => {
	// try {
	// 	// Close any existing connections first
	// 	await mongoose.disconnect();

	// 	// Create new memory server instance
	// 	mongoServer = await MongoMemoryServer.create();
	// 	const mongoUri = mongoServer.getUri();

	// 	// Connect to in-memory database
	// 	await mongoose.connect(mongoUri, {
	// 		dbName: 'test-db',
	// 		// Add these options to avoid deprecation warnings
	// 		autoCreate: true,
	// 		autoIndex: true
	// 	});

	// 	logger.info(`Connected to in-memory MongoDB at ${mongoUri}`);
	// } catch (error) {
	// 	logger.error('Failed to setup test environment:', error);
	// 	throw error;
	// }
	await db.connect();
	request = supertest(app);
});

afterEach(async () => {
	await db.clearDatabase();
});

afterAll(async () => {
	try {
		// Cleanup
		await db.closeDatabase();

		logger.info('Cleaned up test environment');
	} catch (error) {
		logger.error('Failed to cleanup test environment:', error);
		throw error;
	}
});

export { request };
