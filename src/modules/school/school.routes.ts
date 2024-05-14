import { Router } from 'express';
import classes from './classes/class.routes';
import students from './students/student.routes';
import teacher from './teachers/teacher.routes';
import issues from './issues/issue.routes';
import events from './events/event.routes';
import payments from './payments/payment.routes';
import expenses from './expenses/expense.routes';

const router = Router();

router.use('/classes', classes);
router.use('/students', students);
router.use('/issues', issues);
router.use('/teachers', teacher);
router.use('/events', events);
router.use('/payments', payments);
router.use('/expenses', expenses);

export default router;
