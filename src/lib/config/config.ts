import * as dotenv from 'dotenv';
import * as path from 'path';
import { getOsEnv, normalizePort } from './utils';

dotenv.config({
  path: path.join(
    process.cwd(),
    `.env${process.env.NODE_ENV === 'test' ? '.test' : ''}`,
  ),
});

export const config = {
  node: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  isDevelopment: process.env.NODE_ENV === 'development',
  app: {
    // name: getOsEnv("APP_NAME"),
    // host: getOsEnv("APP_HOST"),
    // schema: getOsEnv("APP_SCHEMA"),
    // routePrefix: getOsEnv("APP_ROUTE_PREFIX"),
    port: normalizePort(process.env.PORT || getOsEnv('PORT')),
    // banner: toBool(getOsEnv("APP_BANNER")),
  },
  cors: {
    credentials: true,
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    optionsSuccessStatus: 200,
  },
};
