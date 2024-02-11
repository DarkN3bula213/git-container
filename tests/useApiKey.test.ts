import supertest from 'supertest';
import { app } from '../src/app';
import { ApiKeyModel } from '../src/modules/auth/apiKey/apiKey.model';
import { cleanUpMockApiKeys, createMockApiKey } from './mocks';
import { validApiKey } from './setup';



const request = supertest(app);

describe('useApiKey Middleware', () => {
 

it('should allow access with a valid API key', async () => {
  const response = await request
    .get('/api') 
    .set('x-api-key', validApiKey
    );  

  expect(response.status).toBe(200);  
});
 

  // Here you will add another test for a successful request with a valid API key
  it('should return 403 Forbidden for an invalid API key', async () => {
    const invalidApiKey = 'invalidapikey123';
    const response = await request
      .get('/api') // Adjust the path according to your route setup
      .set('x-api-key', invalidApiKey);

    expect(response.status).toBe(403);
    // Add more assertions here if you want to  check the response body
  });

});
