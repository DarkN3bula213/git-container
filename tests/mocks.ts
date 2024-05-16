import { app } from "../src/app";
import  ApiKey, { ApiKeyModel, findByKey }   from "../src/modules/auth/apiKey/apiKey.model";

 

 export const createMockApiKey = async () => {
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