import { app } from '../src/app';
import supertest from 'supertest';
describe('Testing the initial setup for the app', () => {
  it('Check if package json is correctly setup for test', () => {
    function sum(a: number, b: number) {
      return a + b;
    }
    expect(sum(1, 2)).toBe(3);
  });
});

const request = supertest(app);

describe('Testing the app', () => {
  it('Check if app is correctly setup', () => {
    expect(app).toBeDefined();
  });

  it('The health check should return 200', async () => {
    const response = await request.get('/');
    expect(response.status).toBe(200);
  });
});
