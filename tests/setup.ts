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

  await mongoose.connect(mongoURI, { dbName: 'testDB' }); // Use a dedicated test DB

  await mongoose.connection.db.dropDatabase(); // Ensure clean database

  // Seed class data if needed
  if (classes && classes.length > 0) {
    await ClassModel.insertMany(classes); // Replace with your ClassModel
  }

  validApiKey = await createMockApiKey(); // Use your API key generation logic
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});