import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import { expect, jest, test,beforeAll } from '@jest/globals';
dotenv.config({ path: './tests/.env.test' });

let mongo: any;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const mongoURI = mongo.getUri();
  await mongoose.connect(mongoURI, {});
// console.log('process.env.MONGO_URL')
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (mongo) {
    await mongo.stop();
  }
  await mongoose.connection.close();
});