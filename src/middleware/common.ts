import { config, loginLimiter, morganMiddleware as morgan } from '@/lib/config';
import { corsOptions } from '@/lib/config/cors';
import { sessionOptions } from '@/lib/handlers/sessionHandler';
import { RequestLogger } from '@/lib/logger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { type Application, json, urlencoded } from 'express';
import sanitize from 'express-mongo-sanitize';
import session from 'express-session';
import helmet from 'helmet';
import hpp from 'hpp';
import apiKey from '../middleware/useApiKey';
import sanitizeInputs from './sanitizeReq';

export default (app: Application) => {
  // Trust proxy for secure cookies in production
  app.set('trust proxy', 1);
  app.use(cookieParser());
  // Security Middleware
  app.use(helmet());
  app.use(compression());
  app.use(hpp());
  app.use(sanitizeInputs);

  // CORS Middleware - It's generally a good practice to put CORS early in the middleware stack
  app.use(cors(corsOptions));

  // Logging Middleware
  app.use(morgan);
  app.use(RequestLogger);

  // Parsing Middleware
  app.use(urlencoded(config.urlEncoded));
  app.use(json(config.json));

  // Sanitization
  app.use(sanitize());

  // Cookies and Sessions

  app.use(session(sessionOptions));

  // API Key Middleware
  app.use(apiKey);

  // Rate Limiting Middleware
  app.use(loginLimiter);
};
