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

let request = supertest(app);
 
addAuthHeaders(request);
describe('Testing the app', () => {
//   beforeEach(() => {
//     mockFindApiKey.mockClear();
//   });
  it('Check if app is correctly setup', () => {
    expect(app).toBeDefined();
  });

  it('Should Throw an error if api key is not provided', async () => {
    const response = await request.get('/api').timeout(1000);
    expect(response.status).toBe(401);
  });

  it('Should return a status code of 200', () => {
    return request.get('/api').expect(200);
  });

  it('The health check should return 200', async () => {
    const response = await request.get('/api').timeout(1000);
    expect(response.status).toBe(200);
  });

 it('Should throw an error if api key is not valid', async() => {
    mockFindApiKey.mockResolvedValueOnce(null);
    const response = await request.get('/api') 
    expect(response.status).toBe(401);
 });
});
