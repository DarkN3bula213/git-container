import {  ApiKeyModel }   from "../src/modules/auth/apiKey/apiKey.model";

 

 export const createMockApiKey = async () => {
  // Check if the api key already exists
  const existingApiKey = await ApiKeyModel.findOne({key: 'testapikey123'});
  if (existingApiKey) {
    return existingApiKey.key;
  }
   const apiKey = await ApiKeyModel.create({
     key: 'testapikey123',
     version: 1,
     permissions: ['GENERAL'],
     comments: [],
     status: true,
     createdAt: new Date(),
     updatedAt: new Date(),
   });
   return apiKey.key;
 };

 export const cleanUpMockApiKeys = async () => {
   await ApiKeyModel.deleteMany({});
 }; 


 /**
  * import { createMockApiKey, cleanUpMockApiKeys } from './globalMocks';
  * 
  *   describe('useApiKey Middleware', () => {
  *   let validApiKey: string;
  * 
  *   beforeAll(async () => {
  *     validApiKey = await createMockApiKey();
  *   });
  * 
  *   afterAll(async () => {
  *     await cleanUpMockApiKeys();
  *   });
  * 
  *   // Your test cases...
  * 
  * });

  */