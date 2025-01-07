import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Logger } from '../src/lib/logger/logger';
import { setup } from './utils';

const logger = new Logger('TestDB');
let replset: MongoMemoryReplSet;

export const connect = async () => {
	try {
		// Disconnect any existing connections
		await mongoose.disconnect();

		// Create a new ReplSet with 4 members and storage-engine "wiredTiger"
		// replset = await MongoMemoryReplSet.create({
		// 	replSet: { count: 4, storageEngine: 'wiredTiger' }
		// });

		// const mongoUri = replset.getUri();

		// await mongoose.connect(mongoUri, {
		// 	dbName: 'test-db'
		// });
		await setup({ type: 'replSet' });
		console.log(`Connected to in-memory MongoDB at ${globalThis.__MONGO_URI__}`);
	} catch (error) {
		console.error('Failed to connect to test database:', error);
		throw error;
	}
};

/**
 * 
// fix
async function setup(db) {
  let retries = 5;
  while (retries > 0) {
    retries -= 1;
    try {
      await _setup(db);
    } catch (err) {
      if (err instanceof mongodb.MongoWriteConcernError && /operation was interrupted/.test(err.message)) {
        continue;
      }

      throw err;
    }
  }
}
 */

export const closeDatabase = async () => {
	let retries = 5;
	while (retries > 0) {
		retries -= 1;
		try {
			await mongoose.connection.dropDatabase();
			await mongoose.connection.close();
			await replset.stop();
			console.log('Database connection closed');
			break;
		} catch (error) {
			if (
				error instanceof mongoose.mongo.MongoWriteConcernError &&
				/operation was interrupted/.test(error.message)
			) {
				continue;
			}
			console.error('Failed to close database:', error);
			throw error;
		}
	}
};

export const clearDatabase = async () => {
	try {
		const collections = mongoose.connection.collections;
		for (const key in collections) {
			const collection = collections[key];
			await collection.deleteMany({});
		}
		console.log('Database cleared');
	} catch (error) {
		console.error('Failed to clear database:', error);
		throw error;
	}
};
