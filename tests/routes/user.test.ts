import { app } from '../../src/app';
import supertest from 'supertest';


const request = supertest(app);
const baseUrl = '/api/users';

describe('User routes tests',()=>{

    it('Getting all users', async() => {
        const response = await request
        .get(baseUrl)
        .expect(200)
        // console.log(response.body)
    });

    it('Should create a user', async() => {
        const response = await request
        .post(baseUrl)
        .send({
            name: 'test',
            password: 'test',
            email: 'emias@example.com'   
        })
        .expect(200)   
        // console.log(response.body.data)

    });

    it('Should persist a user',async () => {
       const response  = await request.get(baseUrl).timeout(10000);

    //    console.log(response.body)
       expect(response.body.data[0].name).toBe('test');
        
    });
})