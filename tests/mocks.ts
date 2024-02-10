import { app } from "../src/app";
import  ApiKey, { findByKey }   from "../src/modules/auth/apiKey/apiKey.model";

export const API_KEY = 'GCMUDiuY5a7WvyUNt9n3QztToSHzK7Uj';
export const ACCESS_TOKEN = 'xyz';

export const mockFindApiKey = jest.fn(async (key: string) => {
  if (key == API_KEY)
    return {
      key: API_KEY,
      permissions: ['GENERAL'],
    } as ApiKey;
  else return null;
});
jest.mock('../src/modules/auth/apiKey/apiKey.model', () => ({
  findByKey: mockFindApiKey,
}));

export const addAuthHeaders = (request: any, accessToken = ACCESS_TOKEN) =>
  request
    .set('Content-Type', 'application/json')
    .set('x-api-key', API_KEY)
    .timeout(2000);


    export const addHeaders = (request: any) =>
  request
    .set('Content-Type', 'application/json')
    .set('x-api-key', API_KEY)
    .timeout(2000);
