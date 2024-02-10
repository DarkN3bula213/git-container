import { json, urlencoded, Application } from 'express';
import cors from 'cors';
import router from '../routes';
import { errorHandler } from '@/lib/handlers/errorHandler';
import { morganMiddleware as morgan } from '@/lib/config';
import { NotFoundError } from '@/lib/api';
export default (app: Application) => {
  app.use(json({ limit: '10mb' }));
  app.use(morgan);
  app.use(urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }));
  app.use(cors());
  app.use('/api', router);
  app.all('*', (req, res, next) => next(new NotFoundError()));
  app.use(errorHandler);
};