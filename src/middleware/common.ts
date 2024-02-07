import { json, urlencoded, Application } from 'express';
import cors from 'cors';
import router from '../routes';
import { errorHandler } from '@/lib/handlers/errorHandler';

export default (app: Application) => {
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }));
  app.use(cors());
  app.use(router);
  app.use(errorHandler);
};
