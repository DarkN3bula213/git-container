import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import mongoose from 'mongoose';

const logger = new Logger(__filename);

// const URI = `mongodb://${config.mongo.user}:${encodeURIComponent(config.mongo.pass)}@127.0.0.1:${config.mongo.port}/${config.mongo.database}?authSource=admin`;
const URI = `mongodb://${config.mongo.user}:${encodeURIComponent(config.mongo.pass)}@127.0.0.1:27017/docker-db?replicaSet=rs0`;

let conStr = '';

if (config.isDocker) {
	conStr = config.mongo.url;
} else {
	conStr = URI;
}

const connect = async () => {
	const options = {
		autoIndex: true,
		minPoolSize: 5,
		maxPoolSize: 10,
		connectTimeoutMS: 60000,
		socketTimeoutMS: 45000,
		dbName: 'docker-db'
	};

	let retry = 0;
	const maxRetries = 10;

	const attemptConnection = async () => {
		try {
			await mongoose.connect(conStr, options);
			logger.info(`Database connected: ${mongoose.connection.name}`);

			mongoose.connection.on('error', (err) => {
				logger.error(`Mongoose default connection error: ${err}`);
			});
			mongoose.connection.on('disconnected', () => {
				logger.info('Mongoose default connection disconnected');
			});
			mongoose.connection.on('reconnected', () => {
				logger.info('Mongoose default connection reconnected');
			});
			mongoose.connection.on('close', () => {
				logger.info('Mongoose default connection closed');
			});
			// mongoose.set('debug', true);
		} catch (err: any) {
			logger.error(`Database connection error: ${err.message}`);

			if (retry < maxRetries) {
				retry += 1;
				logger.info(
					`Retrying connection attempt ${retry}/${maxRetries} in 10 seconds...`
				);
				setTimeout(attemptConnection, 10000);
			} else {
				logger.error(
					'Max retries reached. Could not connect to the database.'
				);
				process.exit(1); // Optionally, exit the process if retries fail
			}
		}
	};

	await attemptConnection();
};

class dBclient {
	async connect(): Promise<void> {
		await connect();
	}

	async disconnect(): Promise<void> {
		await mongoose.connection.close();
	}
}

export const db = new dBclient();
