import { Router } from 'express';
import * as controller from './class.controller';
import * as schema from './class.schema';
import { validate } from '@/lib/handlers/validate';

const router = Router();

router
  .route('/')
  .get(controller.findClasses)
  .post(validate(schema.singleClass), controller.addClass)
  .delete(controller.deleteAll);

router
  .route('/:id')
  .get(controller.findClassById)
  .put(validate(schema.singleClass), controller.updateClass)
  .delete(controller.deleteClass);

router.get('/name/:name', controller.findClassByName);

router.put('/fee/:name', validate(schema.fee), controller.updateClassFee);

router.post('/seed', validate(schema.multiClass), controller.insertMany);

router.post(
  '/subject/:classId',
  schema.addSubjectToClass,
  controller.addSubjectToClass,
);

export default router;
