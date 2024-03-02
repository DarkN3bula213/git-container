import cors from 'cors';
import { allowedOrigins, headers, methods } from '../constants/allowedOrigins';

export const options: cors.CorsOptions = {
  origin: 'https://hps-admin.com', // Adjust to your front-end domain
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Explicitly define allowed methods
  credentials: true, // This is important for cookies
  allowedHeaders: [
    'Content-Type',
    'x-api-key',
    'Authorization',
    'x-access-token',
    'x-refresh-token',
  ], // Specify allowed headers
  exposedHeaders: ['Set-Cookie'], // Expose headers if you need the client-side to read the Set-Cookie header
  optionsSuccessStatus: 200,
};
