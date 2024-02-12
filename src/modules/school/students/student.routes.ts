import { Router } from 'express';

import * as controller from './student.controller';

import * as schema from './student.schema';

import { validate } from '@/lib/handlers/validate';

const router = Router();

router.route('/').get(controller.getStudents).post(controller.createStudent);
router.route('/:id').get(controller.getStudentsById);
router.route('/seed').post(controller.bulkPost);
router.route('/sortedByClassName').get(controller.sortedByClassName);


export default router;