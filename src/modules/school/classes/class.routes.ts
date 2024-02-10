import { Router } from 'express';
import * as controller from './class.controller';
import * as schema from './class.schema';
import { validate } from '@/lib/handlers/validate';
const router = Router();

router
  .route('/')
  .get(controller.findClasses)
  .post(validate(schema.singleClass), controller.addClass);

router
  .route('/:id')
  .get(controller.findClassById)
  .put(validate(schema.singleClass), controller.updateClass)
  .delete(controller.deleteClass);

router.post('/createMany', validate(schema.multiClass), controller.insertMany);

export default (): Router => router;
