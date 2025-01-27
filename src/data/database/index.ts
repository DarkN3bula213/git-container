import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import mongoose, { ConnectOptions } from 'mongoose';

// import { dbClient } from './db.client';

const logger = new Logger(__filename);

// const URI = `mongodb://${config.mongo.user}:${encodeURIComponent(config.mongo.pass)}@127.0.0.1:${config.mongo.port}/${config.mongo.database}?authSource=admin`;
const URI = `mongodb://${config.mongo.user}:${encodeURIComponent(config.mongo.pass)}@127.0.0.1:27017/docker-db?replicaSet=rs0`;

let conStr = '';

if (config.isDocker) {
	conStr = config.mongo.url;
} else {
	conStr = URI;
}
const options: ConnectOptions = {
	autoIndex: true,

	minPoolSize: 5,
	maxPoolSize: 10,
	connectTimeoutMS: 60000,
	socketTimeoutMS: 45000,
	dbName: 'docker-db'
};
export const connect = async () => {
	let retry = 0;
	const maxRetries = 10;

	const attemptConnection = async () => {
		try {
			if (retry === 0) {
				logger.warn('Connecting to database...');
			}
			await mongoose.connect(conStr, options);
			logger.debug(`Database connected: ${mongoose.connection.name}`);

			mongoose.connection.on('error', (err) => {
				logger.error(`Mongoose default connection error: ${err}`);
			});
			mongoose.connection.on('disconnected', () => {
				logger.debug('Mongoose default connection disconnected');
			});
			mongoose.connection.on('reconnected', () => {
				logger.debug('Mongoose default connection reconnected');
			});
			mongoose.connection.on('close', () => {
				logger.debug('Mongoose default connection closed');
			});
			// mongoose.set('debug', true);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			logger.error(`Database connection error: ${err.message}`);

			if (retry < maxRetries) {
				retry += 1;
				logger.debug(
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

interface DatabaseConfig {
	maxAttempts: number;
	initialDelay: number;
	maxDelay: number;
	connectionTimeout: number;
	socketTimeout: number;
	minPoolSize: number;
	maxPoolSize: number;
	dbName: string;
}
class DBClient {
	private static instance: DBClient;
	private isConnecting: boolean = false;
	private reconnectTimeout?: NodeJS.Timeout;
	private readonly config: DatabaseConfig;

	private constructor() {
		this.config = {
			maxAttempts: 5,
			initialDelay: 1000,
			maxDelay: 30000,
			connectionTimeout: 60000,
			socketTimeout: 45000,
			minPoolSize: 5,
			maxPoolSize: 10,
			dbName: 'docker-db'
		};
		// Remove existing listeners to prevent duplicates
		mongoose.connection.removeAllListeners();
		this.setupEventListeners();
	}

	public static getInstance(): DBClient {
		if (!DBClient.instance) {
			DBClient.instance = new DBClient();
		}
		return DBClient.instance;
	}

	private getConnectionOptions(): ConnectOptions {
		return {
			autoIndex: true,
			autoCreate: true,
			writeConcern: {
				w: 'majority',
				j: true,
				fsync: true
			},
			readPreference: 'primary',
			minPoolSize: this.config.minPoolSize,
			maxPoolSize: this.config.maxPoolSize,
			connectTimeoutMS: this.config.connectionTimeout,
			socketTimeoutMS: this.config.socketTimeout,
			serverSelectionTimeoutMS: this.config.connectionTimeout,
			heartbeatFrequencyMS: 10000,
			retryWrites: true,
			retryReads: true,
			dbName: this.config.dbName
		};
	}

	private calculateBackoff(attempt: number): number {
		const delay = Math.min(
			this.config.initialDelay * Math.pow(2, attempt),
			this.config.maxDelay
		);
		return delay + Math.random() * 1000; // Add jitter
	}

	private setupEventListeners(): void {
		mongoose.connection.on('error', (err) => {
			logger.error(`Mongoose default connection error: ${err}`);
		});
		mongoose.connection.on('disconnected', () => {
			logger.warn('Mongoose default connection disconnected');
		});
		mongoose.connection.on('reconnected', () => {
			logger.warn('Mongoose default connection reconnected');
		});
		mongoose.connection.on('close', () => {
			logger.warn('Mongoose default connection closed');
		});
	}

	public async connect(): Promise<void> {
		if (this.isConnecting) {
			logger.warn('Connection attempt already in progress');
			return;
		}
		logger.warn('Connecting to MongoDB');
		this.isConnecting = true;
		const URI = conStr;
		const options = this.getConnectionOptions();

		for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
			try {
				await mongoose.connect(URI, options);
				logger.warn('Successfully connected to MongoDB');
				return;
			} catch (error) {
				if (attempt === this.config.maxAttempts - 1) {
					this.isConnecting = false;
					throw new Error(
						`Failed to connect to MongoDB after ${this.config.maxAttempts} attempts: ${error}`
					);
				}

				const delay = this.calculateBackoff(attempt);
				logger.warn(
					`Connection attempt ${attempt + 1}/${this.config.maxAttempts} failed. ` +
						`Retrying in ${Math.round(delay / 1000)}s...`
				);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	public async disconnect(): Promise<void> {
		try {
			// Clear any reconnection timeout
			if (this.reconnectTimeout) {
				clearTimeout(this.reconnectTimeout);
				this.reconnectTimeout = undefined;
			}

			if (mongoose.connection.readyState !== 0) {
				await mongoose.disconnect();
				logger.warn('Disconnected from MongoDB');
			}
		} catch (error) {
			logger.error('Error during MongoDB disconnect:', error);
			throw error;
		}
	}
}

export const db = DBClient.getInstance();

// export const dbConnect = dbClient.connect(conStr, options);
// export const dbDisconnect = dbClient.disconnect();
