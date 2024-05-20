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

export default (app: Application) => {
  // Trust proxy
  app.set('trust proxy', 1);

  // Security Middleware
  app.use(helmet());
  app.use(compression());
  app.use(hpp());

  // Logging Middleware
  app.use(morgan);
  app.use(RequestLogger);

  // API Key Middleware
  app.use(apiKey);

  // Parsing Middleware
  app.use(urlencoded(config.urlEncoded));
  app.use(json(config.json));
  app.use(sanitize());
  app.use(cookieParser());

  // CORS Middleware
  app.use(
    cors({
      origin: 'https://hps-admin.com',
      credentials: true,
      preflightContinue: true,
      optionsSuccessStatus: 204,
      methods: ['GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'x-api-key',
        'Authorization',
        'x-access-token',
      ],
      exposedHeaders: ['Set-Cookie'],
    }),
  );

  // Session Middleware
  app.use(session(sessionOptions));

  // Rate Limiting Middleware
  app.use(loginLimiter);
};
