import supertest from 'supertest';
import { app } from '../../../src/app';
import {createIssue}from '../../../src/modules/school/issues/issue.controller'
import { validApiKey } from '../../setup';
import mongoose from 'mongoose';
import { tokens } from '../auth/authUtils';
import {authenticate } from '../../../src/middleware/authenticated';
const request = supertest(app);
import { Request, Response,NextFunction } from 'express';

describe('', () => {
  // Mock middleware

  it('It should create a issue with a valid user and complete Issue data', async () => {
    jest.mock('../../../src/middleware/authenticated'); // Replace with your middleware import path
    const mockAuthenticate = jest.fn();
    mockAuthenticate.mockReturnValue((req: Request, res: Response, next: NextFunction) => next()); // Always call next

    const response = await request
      .post('/api/school/issues')
      .set('x-api-key', validApiKey)
      .set('x-access-token', `${tokens.access}`)
      .set('x-refresh-token', `${tokens.refresh}`)

      .send({
        title: 'Test Issue',
        description: 'Test Description',
      });
  });
}
)