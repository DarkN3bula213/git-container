import mongoose from 'mongoose';
import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
const logger = new Logger(__filename);

const URI = `mongodb://${config.mongo.host}:${config.mongo.port}/${config.mongo.database}`;

const dbURI = `mongodb://devuser:devpassword@localhost:27017/`;

logger.debug(dbURI);
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
    const client = await mongoose.connect(dbURI);
    logger.info(`Database connected: ${client.connection.name}`);

    client.set('strictQuery', true);

    // Create the database connection
    client
      .plugin((schema: any) => {
        schema.pre('findOneAndUpdate', setRunValidators);
        schema.pre('updateMany', setRunValidators);
        schema.pre('updateOne', setRunValidators);
        schema.pre('update', setRunValidators);
      })
      .connect(dbURI, options)
      .then(() => {
        logger.info('Mongoose connection done');
      })
      .catch((e) => {
        logger.info('Mongoose connection error');
        logger.error(e);
      });

    // CONNECTION EVENTS
    // When successfully connected
    client.connection.on('connected', () => {
      logger.debug('Mongoose default connection open to ' + dbURI);
    });

    // If the connection throws an error
    client.connection.on('error', (err) => {
      logger.error('Mongoose default connection error: ' + err);
    });

    // When the connection is disconnected
    client.connection.on('disconnected', () => {
      logger.info('Mongoose default connection disconnected');
    });
  } catch (err: any) {
    logger.error(err.message);
  }
  return mongoose.connection;
};
