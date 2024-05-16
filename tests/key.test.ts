import supertest from 'supertest';
import { app } from '../src/app';
import { findByKey } from '@/modules/auth/apiKey/apiKey.model';


  
const request = supertest(app);

 

describe('Valid Api Key should pass the health check', () => {

    it('should return 403 if API key is missing', async () => {
      const res = await request.get('/api/health');  

      expect(res.status).toBe(403); 
    });
});
 
 
  
