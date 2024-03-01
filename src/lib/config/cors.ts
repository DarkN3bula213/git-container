import cors from 'cors';
import { allowedOrigins, headers, methods } from '../constants/allowedOrigins';

export const options: cors.CorsOptions = {
  exposedHeaders: ['x-access-token', 'x-refresh-token'],

  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin!) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },

  allowedHeaders: headers,
  credentials: true,
  methods: methods,
  preflightContinue: true,
};
