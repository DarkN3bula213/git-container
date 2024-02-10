import { app } from '../src/app';
import supertest from 'supertest';
import { addAuthHeaders, mockFindApiKey } from './mocks';
import ApiKey from '../src/modules/auth/apiKey/apiKey.model';
describe('Testing the initial setup for the app', () => {
  it('Check if package json is correctly setup for test', () => {
    function sum(a: number, b: number) {
      return a + b;
    }
    expect(sum(1, 2)).toBe(3);
  });
});

const request = supertest(app);

// const requestWithHeader =(method: string, path: string) => {

//   return addAuthHeaders(request[method](path));
// }
 
  beforeAll(() => {

    mockFindApiKey.mockImplementation(async (key: string) => {
      if (key == 'GCMUDiuY5a7WvyUNt9n3QztToSHzK7Uj')
        return {
          key: 'GCMUDiuY5a7WvyUNt9n3QztToSHzK7Uj',
          permissions: ['GENERAL'],
        } as ApiKey;
      else return null;
    });

  });

  const baseUrl = '/api';
describe('Testing the app', () => {


  it('Check if app is correctly setup', () => {
    expect(app).toBeDefined();
  });
 
it('Should fail a request on with valid api key',async () => {

  return await request
    .get(baseUrl)
    .expect(400)
   
});

it('Should pass the request with valid api key',async () => {

 
  return await request
    .get(baseUrl)
    .set('x-api-key', 'GCMUDiuY5a7WvyUNt9n3QztToSHzK7Uj')
    .expect(200)
});

});
