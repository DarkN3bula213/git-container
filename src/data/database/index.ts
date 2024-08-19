import mongoose from 'mongoose';
import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
const logger = new Logger(__filename);

// const URI = `mongodb://${config.mongo.user}:${encodeURIComponent(config.mongo.pass)}@127.0.0.1:${config.mongo.port}/${config.mongo.database}?authSource=admin`;
const URI = `mongodb://${config.mongo.user}:${encodeURIComponent(config.mongo.pass)}@127.0.0.1:27017/docker-db?replicaSet=rs0`;

let conStr = '';

if (config.isDocker) {
  conStr = config.mongo.url;
} else {
  conStr = URI;
}
const options = {
  autoIndex: true,
  minPoolSize: 5,
  maxPoolSize: 10,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 45000,
  dbName: 'docker-db',
};
const connectionStrings = [
  'mongodb://devuser:devpassword@host1.docker.internal:27017/docker-db',
  'mongodb://devuser:devpassword@192.168.32.1:27017/docker-db',
  'mongodb://devuser:devpassword@192.168.32.2:27017/docker-db',
  'mongodb://devuser:devpassword@192.168.32.3:27017/docker-db',
  'mongodb://devuser:devpassword@192.168.32.4:27017/docker-db',
  'mongodb://devuser:devpassword@192.168.32.5:27017/docker-db',
  'mongodb://devuser:devpassword@192.168.32.6:27017/docker-db',
  'mongodb://devuser:devpassword@192.168.32.7:27017/docker-db',
  'mongodb://devuser:devpassword@192.168.32.8:27017/docker-db',
  'mongodb://devuser:devpassword@172.17.0.1:27017/docker-db',
  'mongodb://devuser:devpassword@24.144.94.199:27017/docker-db',
  'mongodb://devuser:devpassword@0.0.0.0:27017/docker-db',
  'mongodb://devuser:devpassword@mongo:27017/docker-db',
  'mongodb://host.docker.internal:27017/docker-db',
  'mongodb://devuser:devpassword@host.docker.internal:27017/docker-db?authSource=admin',
];

const connectWithRetry = (index: number) => {
  if (index >= connectionStrings.length) {
    console.error(
      'Failed to connect to MongoDB: All connection attempts failed',
    );
    return;
  }

  const connectionString = connectionStrings[index];

  logger.debug(
    `Attempting ${index} to connect to MongoDB using: ${connectionString}`,
  );
  mongoose
    .connect(connectionString, options)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.error(
        `Failed to connect to MongoDB using ${connectionString}:`,
        err.message,
      );
      console.log(
        `Retrying connection using the next connection string in 5 seconds...`,
      );

      setTimeout(() => connectWithRetry(index + 1), 5000); // Retry after 5 seconds with the next connection string
    });
};
const connect = async () => {
  const options = {
    autoIndex: true,
    minPoolSize: 5,
    maxPoolSize: 10,
    connectTimeoutMS: 60000,
    socketTimeoutMS: 45000,
    dbName: 'docker-db',
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
    } catch (err: any) {
      logger.error(`Database connection error: ${err.message}`);

      if (retry < maxRetries) {
        retry += 1;
        logger.info(
          `Retrying connection attempt ${retry}/${maxRetries} in 10 seconds...`,
        );
        setTimeout(attemptConnection, 10000);
      } else {
        logger.error('Max retries reached. Could not connect to the database.');
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
