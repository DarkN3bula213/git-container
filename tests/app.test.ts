import { app } from '../src/app';
import supertest from 'supertest';
import { cleanUpMockApiKeys, createMockApiKey } from './mocks';
import { validApiKey } from './setup';
import { validUserData } from './utils';
// export let validApiKey: string;

// beforeAll(async () => {
//   validApiKey = await createMockApiKey();
// });

// afterAll(async () => {
//   await cleanUpMockApiKeys();
// });

describe('Testing the initial setup for the app', () => {
  const user = {
    username: 'fazal22',
    email: 'fazal@admin.hps.com',
    name: 'Khawaja Fazal Ur Rehman',
    father_name: 'Khawaja Abdul Rasheed Rathore',
    gender: 'male',
    cnic: '34603-6721888-7',
    dob: '1974-11-22',
    cnic_issued_date: '2021-03-02',
    cnic_expiry_date: '2031-03-02',
    password: 'temp1234',
  };
  it('Should fail validation if incomplete user details are provided', async () => {
    const response = await request
      .post('/api/users')
      .send({
        name: 'test',
        email: 'test',
      })
      .set('x-api-key', validApiKey);
    expect(response.status).toBe(400);
  });
  it('Should create a user', async () => {
    const response = await request
      .post('/api/users')
      .send(user)
      .set('x-api-key', validApiKey);
    expect(response.status).toBe(200);
  });

  it('Should return an array of user data', async () => {
    const response = await request
      .get('/api/users')
      .timeout(1000)
      .set('x-api-key', validApiKey);
    expect(response.status).toBe(200);
  });

  it('Duplicate email should throw an error', async () => {
    const response = await request
      .post('/api/users')
      .send(validUserData)
      .set('x-api-key', validApiKey);
    expect(response.status).toBe(400);
  });
});

const request = supertest(app);
