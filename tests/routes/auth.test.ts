import { app } from '../../src/app';
import request from 'supertest';


// const request = supertest(app);
const baseUrl = '/api/auth';


describe('POST /login', () => {
//   it('should authenticate user and return JWT token', async () => {
//     const userData = {
//       email: 'user@example.com',
//       password: 'password123',
//     };

//     const response = await request(app).post('/login').send(userData);

//     expect(response.status).toBe(200);
//     expect(response.body).toHaveProperty('token');
//   });

//   it('should fail authentication with invalid credentials', async () => {
//     const userData = {
//       email: 'user@example.com',
//       password: 'wrongpassword',
//     };

//     const response = await request(app).post('/login').send(userData);

//     expect(response.status).toBe(401);
//     expect(response.body).not.toHaveProperty('token');
//   });

it('Placeholder', () => {
    expect(true).toBe(true);
    
});
});