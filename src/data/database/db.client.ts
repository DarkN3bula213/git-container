import { Logger } from '@/lib/logger';
import mongoose from 'mongoose';

class DbClient {
	private readonly client: mongoose.Connection;
	private readonly logger: Logger;
	private connected: boolean = false;
	private retryCount: number = 0;
	private readonly maxRetries: number = 10;

	constructor() {
		this.client = mongoose.connection;
		this.logger = new Logger('DbClient');
		this.setListeners();
	}

	private setListeners() {
		this.client.on('connected', () => {
			this.connected = true;
			this.logger.debug('Database connected');
		});
		this.client.on('error', (err) => {
			this.logger.error('Database connection error:', err);
		});
		this.client.on('disconnected', () => {
			this.connected = false;
			this.logger.debug('Database disconnected');
		});
		this.client.on('reconnected', () => {
			this.connected = true;
			this.logger.debug('Database reconnected');
		});
		this.client.on('close', () => {
			this.connected = false;
			this.logger.debug('Database connection closed');
		});
	}

	public async connect(
		uri: string,
		options?: mongoose.ConnectOptions
	): Promise<void> {
		try {
			await mongoose.connect(uri, options);
		} catch (error) {
			this.logger.error('Database connection error:', error);
			if (this.retryCount < this.maxRetries) {
				this.retryCount++;
				this.logger.debug(
					`Retrying connection attempt ${this.retryCount}/${this.maxRetries} in 10 seconds...`
				);
				setTimeout(() => this.connect(uri), 10000);
			} else {
				this.logger.error(
					'Max retries reached. Could not connect to the database.'
				);
			}
		}
	}

	public async disconnect(): Promise<void> {
		try {
			await mongoose.connection.close();
			this.connected = false;
			this.logger.info('MongoDB connection closed');
		} catch (error) {
			this.logger.error('Error disconnecting from MongoDB:', error);
			throw error;
		}
	}
}

export const dbClient = new DbClient();
