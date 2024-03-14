import { Router } from 'express';
import classes from './classes/class.routes';
import students from './students/student.routes';
import teacher from './teachers/teacher.routes';
import issues from './issues/issue.routes';
import events from './events/event.routes';
import { authentication } from '@/middleware/authMiddleware';

const router = Router();
// router.use(authentication);
router.use('/classes', classes);
router.use('/students', students);
router.use('/issues', issues);
router.use('/teachers', teacher);
router.use('/events', events);

export default router;
