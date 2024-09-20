import { ValidationSource, validate } from '@/lib/handlers/validate';

import { Router } from 'express';

import controller from '../../../middleware/useApiKey';
import schema from './apiKey.schema';

const router = Router();

router.use(validate(schema.apiKey, ValidationSource.HEADER), controller);

export default router;
