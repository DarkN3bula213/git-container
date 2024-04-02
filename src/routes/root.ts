import { Logger } from '@/lib/logger';
import { Router } from 'express';
import path from 'path';

const router = Router();
const dir = path.join(__dirname, '..', 'views');

const logger = new Logger(__filename);

logger.debug({
  dir,
});
router.get('^/$|/index(.html)?', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

export default router;
