import { Router } from 'express';
import classes from '../modules/school/classes/class.routes';
import students from '../modules/school/students/student.routes';
import teacher from '../modules/school/teachers/teacher.routes';
import issues from '../modules/school/issues/issue.routes';
import events from '../modules/school/events/event.routes';
import payments from '../modules/school/payments/payment.routes';
import custom from '../modules/school/payments/custom.router';
import expenses from '../modules/school/expenses/expense.routes';

const router = Router();

router.use('/classes', classes);
router.use('/students', students);
router.use('/issues', issues);
router.use('/teachers', teacher);
router.use('/events', events);
router.use('/payments', payments);
router.use('/custom', custom);
router.use('/expenses', expenses);

export default router;
