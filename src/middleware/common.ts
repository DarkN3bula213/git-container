import { json, urlencoded, Application } from 'express';
import cors from 'cors';
import router from '../routes';
import { errorHandler } from '@/lib/handlers/errorHandler';
import { morganMiddleware as morgan } from '@/lib/config';
import { NotFoundError } from '@/lib/api';
import { options } from '@/lib/config/cors';
export default (app: Application) => {
  app.use(morgan);
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }));
  app.use(cors(options));
  app.get('/test', (req, res) => res.send('Test route'));

  app.use('/api', router);
  app.all('*', (req, res, next) => next(new NotFoundError()));
  app.use(errorHandler);
};
