import supertest from 'supertest';
import { app } from '../../../src/app';
import { classes } from '../../utils';
import { validApiKey } from '../../setup';
const request = supertest(app);

// beforeAll(async () => {
//   request
//     .post('/api/school/classes/seed')
//     .send({
//       classes,
//     })
//     .set('x-api-key', validApiKey).timeout(15000);
// });

describe('Test relating to class crud methods', () => {
  it('Classes should be called successfully', async () => {
    const response = await request
      .get('/api/school/classes')
      .set('x-api-key', validApiKey);
    expect(response.status).toBe(200);
  });

  it('Should reject duplicate classes', async () => {
 
    const response2 = await request
      .post('/api/school/classes')
      .send(classes[0])
      .set('x-api-key', validApiKey)
      .timeout(5000);
    expect(response2.status).toBe(500);
  });

  it('Should be able to update class fee', async () => {
    const response = await (
      await request
        .put('/api/school/classes/fee/Prep')
        .send({ fee: 1000 })
        .set('x-api-key', validApiKey)
    ).body;
    expect(response.data.fee).toBe(1000);
  });

  it('Should be able to delete all classes', async () => {
    const response = await request
      .delete('/api/school/classes')
      .set('x-api-key', validApiKey);
    expect(response.status).toBe(200);
  });
});
