import { app } from '../../src/app';
import supertest from 'supertest';
import { validApiKey } from '../setup';
import {
  incompleteCredentials,
  WrongCredentials,
  validCredentials,
  validUserData,
} from '../utils';
import { Logger } from '../../src/lib/logger';
import { UserModel } from '../../src/modules/auth/users/user.model';
import { Keystore } from '../../src/modules/auth/keyStore/keyStore.model';
const logger = new Logger(__filename);

const request = supertest(app);

describe('Test relating to user crud methods', () => {
  const user = {
    username: 'failing',
    email: 'failing@admin.hps.com',
    name: 'Khawaja Fazal Ur Rehman',
    father_name: 'Khawaja Abdul Rasheed Rathore',
    gender: 'male',
    cnic: '34603-6721888-7',
    dob: '1974-11-22',
    cnic_issued_date: '2021-03-02',
    cnic_expiry_date: '2031-03-02',
    password: 'temp1234',
  };
  it('Should create a user', async () => {
    const response = await request
      .post('/api/users')
      .send(user)
      .set('x-api-key', validApiKey);
    expect(response.status).toBe(200);
  });
  it('It should fail login with invalid credentials', async () => {
    const response = await request
      .post('/api/auth/login')
      .send(WrongCredentials)
      .set('x-api-key', validApiKey);

    expect(response.status).toBe(401);
  });

  it('It should fail login with incomplete credentials', async () => {
    const response = await request
      .post('/api/auth/login')
      .send(incompleteCredentials)
      .set('x-api-key', validApiKey);

    expect(response.status).toBe(401);
  });

 
});
  