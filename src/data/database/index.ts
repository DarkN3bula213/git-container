import mongoose from 'mongoose';
import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
const logger = new Logger(__filename);

const URI = `mongodb://${config.mongo.user}:${config.mongo.pass}/${config.mongo.host}:${config.mongo.port}/${config.mongo.database}`;

const dbURI = `mongodb://devuser:devpassword@localhost:27017/`;

logger.debug(URI);
function setRunValidators(this: any) {
  this.setOptions({ runValidators: true });
}
export const connect = async () => {
  const options = {
    autoIndex: true,
    minPoolSize: config.mongo.pool.min,
    maxPoolSize: config.mongo.pool.max,
    connectTimeoutMS: 60000,
    socketTimeoutMS: 45000,
  };
  try {
    // Correctly pass options to the connect method
    await mongoose.connect(dbURI, options);
    logger.info(`Database connected: ${mongoose.connection.name}`);
    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose default connection error: ' + err);
    });
    mongoose.connection.on('disconnected', () => {
      logger.info('Mongoose default connection disconnected');
    });
  } catch (err: any) {
    logger.error('Database connection error: ' + err.message);
    throw err; // Rethrow to handle outside
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