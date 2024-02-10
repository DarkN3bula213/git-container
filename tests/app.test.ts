import { app } from '../src/app';
import supertest from 'supertest';
import { addAuthHeaders, mockFindApiKey } from './mocks';
describe('Testing the initial setup for the app', () => {
  it('Check if package json is correctly setup for test', () => {
    function sum(a: number, b: number) {
      return a + b;
    }
    expect(sum(1, 2)).toBe(3);
  });
});

const request = supertest(app);
 
  beforeAll(() => {

  });
describe('Testing the app', () => {


  it('Check if app is correctly setup', () => {
    expect(app).toBeDefined();
  });

  it('Should return a status code of 200', () => {
    return addAuthHeaders(request.get('/api')) 
  });

  it('The health check should return 200', async () => {
    const response = await addAuthHeaders(request.get('/api'));
    expect(response.status).toBe(200);
  });

  it('It should throw a validation error', async () => {
    const res = await addAuthHeaders(request.post('/api')).send({});
    expect(res.status).toBe(400);
  });
 
});