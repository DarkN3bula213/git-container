import supertest from 'supertest';
import { app } from '../src/app';
import { ApiKeyModel } from '../src/modules/auth/apiKey/apiKey.model';
import { cleanUpMockApiKeys, createMockApiKey } from './mocks';
import { validApiKey } from './setup';

const request = supertest(app);

describe('Valid Api Key should pass the health check', () => {
  it('should allow access with a valid API key', async () => {
    const response = await request.get('/api').set('x-api-key', validApiKey);

    expect(response.status).toBe(200);
  });
});

describe('Invalid Api Key', () => {
  it('should return 403 Forbidden for an invalid API key', async () => {
    const invalidApiKey = 'invalidapikey123';
    const response = await request.get('/api').set('x-api-key', invalidApiKey);
    expect(response.status).toBe(403);
  });
});

 
 
