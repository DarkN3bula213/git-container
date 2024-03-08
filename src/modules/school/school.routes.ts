import { Router } from 'express';
import classes from './classes/class.routes';
import students from './students/student.routes';
import issues from './issues/issue.routes';
import { authentication } from '@/middleware/authMiddleware';

const router = Router();
router.use(authentication)
router.use('/classes', classes);
router.use('/students', students);
router.use('/issues', issues);

export default router;
