import supertest from 'supertest';
import { app } from '../../../src/app';
import { validApiKey } from '../../setup';
import { describe } from 'node:test';
import { studentData, students } from './school.utils';
import { Logger } from '../../../src/lib/logger';

const logger = new Logger(__filename);
const request = supertest(app);

describe('Student Related tests', () => {
  it('Students should be called successfully', async () => {
    const response = await request
      .get('/api/school/students')
      .set('x-api-key', validApiKey);
    expect(response.status).toBe(200);
  });

  // Post route
  it('Shoud be able to create a student', async () => {
    const response = await request
      .post('/api/school/students')
      .set('x-api-key', validApiKey)
      .send(studentData);
    expect(response.status).toBe(200);

    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data).toHaveProperty('father_name');
    expect(response.body.data).toHaveProperty('gender');

    expect(response.body.data).toHaveProperty('dob');
  });

  it('Shoudl be able to insert multiple students', async () => {
    const response = await request
      .post('/api/school/students/seed')
      .set('x-api-key', validApiKey)
      .send({
        students: students,
      })
      .timeout(15000);
    expect(response.status).toBe(200);
    logger.info({
      response: JSON.stringify(response.body, null, 2),
    });
  });
});
