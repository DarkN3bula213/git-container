import { Router } from 'express';
import classes from './classes/class.routes';
import students from './students/student.routes';

const router = Router();

router.use('/classes', classes);
router.use('/students', students);

export default router;
