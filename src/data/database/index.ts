import mongoose from 'mongoose';
import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
const logger = new Logger(__filename);

const URI = `mongodb://${config.mongo.user}:${encodeURIComponent(config.mongo.pass)}@127.0.0.1:${config.mongo.port}/${config.mongo.database}?authSource=admin`;

let conStr = '';

if (config.isDocker) {
  conStr = `mongodb://${config.mongo.user}:${encodeURIComponent(config.mongo.pass)}@mongo:${config.mongo.port}/${config.mongo.database}?authSource=admin`;
} else {
  conStr = URI;
}

export const connect = async () => {
  const options = {
    autoIndex: true,
    minPoolSize: config.mongo.pool.min,
    maxPoolSize: config.mongo.pool.max,
    connectTimeoutMS: 60000,
    socketTimeoutMS: 45000,
  };
  let retry = 0;
  try {
    await mongoose.connect(conStr, options);
    logger.info(`Database connected: ${mongoose.connection.name}`);
    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose default connection error: ' + err);
    });
    mongoose.connection.on('disconnected', () => {
      logger.info('Mongoose default connection disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('Mongoose default connection reconnected');
    });
  } catch (err: any) {
    if (retry > 10) {
      logger.error('Database connection error: ' + err.message);
      throw err;
    }
    retry += 1;
    setTimeout(connect, 10000);
    logger.error('Database connection error: ' + err.message);
    throw err;
  }
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
