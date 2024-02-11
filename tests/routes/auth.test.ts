import { app } from '../../src/app';
import supertest from 'supertest';
import { validApiKey } from '../setup';
import {
  incompleteCredentials,
  invalidCredentials,
  validCredentials,
  validUserData,
} from '../utils';

const request = supertest(app);

describe('Test relating to user crud methods', () => {
  it('It should fail login with invalid credentials', async () => {
    const response = await request
      .post('/api/auth/login')
      .send(invalidCredentials)
      .set('x-api-key', validApiKey);

    expect(response.status).toBe(401);
  });

  it('It should fail login with incomed credentials', async () => {
    const response = await request
      .post('/api/auth/login')
      .send(incompleteCredentials)
      .set('x-api-key', validApiKey);

    expect(response.status).toBe(400);
  });

  it('It should login with valid credentials', async () => {
    const response = await request
      .post('/api/auth/login')
      .send(validCredentials)
      .set('x-api-key', validApiKey)
       
  });


});
