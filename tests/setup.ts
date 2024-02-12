import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import { createMockApiKey } from './mocks';
import { classes } from './utils';
import { ClassModel } from '../src/modules/school/classes/class.model';
dotenv.config({ path: './tests/.env.test' });
let mongo: any;
export let validApiKey: string;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const mongoURI = mongo.getUri();
  await mongoose.connect(mongoURI, {});
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }

  validApiKey = await createMockApiKey();

   await ClassModel.insertMany(classes);
});

afterAll(async () => {
  if (mongo) {
    await mongo.stop();
  }
  await mongoose.connection.close();
});
