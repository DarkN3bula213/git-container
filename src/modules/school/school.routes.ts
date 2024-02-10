import { Router } from 'express';
import classes from './classes/class.routes';

const router = Router();
router.use('/classes', classes);

export default router;
