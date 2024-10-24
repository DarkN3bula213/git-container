import cors from 'cors';
import { allowedOrigins } from '../constants/allowedOrigins';

// import { allowedOrigins, headers, methods } from '../constants/allowedOrigins';

export const options = {};

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(new Error('Not allowed by CORS'));
    } else if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  // preflightContinue: true,
  optionsSuccessStatus: 204,
  methods: ['GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'x-api-key',
    'Authorization',
    'x-access-token',
  ],
  exposedHeaders: ['Set-Cookie'],
};
