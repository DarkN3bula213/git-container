import { config } from '@/lib/config';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Bull from 'bull';
import mongoose from 'mongoose';
dotenv.config({ path: './tests/.env.test' });

let mongo: any;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const mongoURI = mongo.getUri();
  await mongoose.connect(mongoURI, { dbName: 'testDB' });
  await mongoose.connection.db.dropDatabase();

  // // Initialize Bull queue
  // global.saveSessionQueue = new Bull('saveSessionQueue', {
  //   redis: {
  //     host: config.redis.host,
  //     port: config.redis.port,
  //   },
  // });

  // // Initialize Redis client
  // global.redisClient = redis.createClient({
  //   host: config.redis.host,
  //   port: config.redis.port,
  // });
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});
