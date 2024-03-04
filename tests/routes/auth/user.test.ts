import supertest from "supertest";
import { app } from "../../../src/app";
import { Logger } from "../../../src/lib/logger";
import { validApiKey } from "../../setup";
import { incompleteCredentials } from "../../utils";
import { tokens } from "./authUtils";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from 'express';
const logger = new Logger(__filename);

const request = supertest(app);


describe('User creation', () => {
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
      .post('/api/users/register')
      .send(user)
      .set('x-api-key', validApiKey);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty( 'tokens'); 
        tokens.access = response.body.tokens.access;
        tokens.refresh = response.body.tokens.refresh;

     
  });
});
it('It should fail login with invalid credentials', async () => {
  const response = await request
    .post('/api/users/login')
    .send({
      email: 'failing@admin.hps.com',
      password: 'wrongpassword',
    })
    .set('x-api-key', validApiKey);

  expect(response.status).toBe(400);
});

it('It should fail login with incomplete credentials', async () => {
  const response = await request
    .post('/api/users/login')
    .send(incompleteCredentials)
    .set('x-api-key', validApiKey);

  expect(response.status).toBe(400);

});

it('Should get authenticated',async () => {
  const response = await request
    .get('/api/protected')
    .set('x-access-token', `${tokens.access}`)
    .set('x-refresh-token', `${tokens.refresh}`)
    .set('x-api-key', validApiKey);
   
  expect(response.status).toBe(200);
});
 