import { Router } from 'express';
import * as controller from './user.controller';
import { validate } from '@/lib/handlers/validate';
import schema from './user.schema';

const router = Router();

router
  .route('/')
  .get(controller.getUsers)
  .post(validate(schema.register), controller.register);

router
  .route('/createMany')
  .post( controller.insertMany);

router
  .route('/:id')
  .get(controller.getUser)
  .put(controller.updateUser)
  .delete(controller.deleteUser);

router.post('/login', validate(schema.login), controller.login);

export default router;
