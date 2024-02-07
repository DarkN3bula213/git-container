import * as dotenv from 'dotenv';
import * as path from 'path';
import { getOsEnv, normalizePort, getOsEnvOptional, toNumber } from './utils';

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
  log: {
    level: getOsEnvOptional('LOG_LEVEL'),
    directory: getOsEnvOptional('LOG_DIR'),
  },
  mongo: {
    host: getOsEnv('DB_HOST'),
    user: getOsEnv('DB_USER'),
    pass: getOsEnv('DB_PASSWORD'),
    port: getOsEnv('DB_PORT'),
    database: getOsEnv('DB_NAME'),
    pool: {
      min: toNumber(getOsEnv('DB_POOL_MIN')),
      max: toNumber(getOsEnv('DB_POOL_MAX')),
    },
    uri: `mongodb://${getOsEnv('DB_USER')}:${getOsEnv('DB_PASSWORD')}@${getOsEnv('DB_HOST')}:${getOsEnv('DB_PORT')}/${getOsEnv('DB_NAME')}`,
  },
  redis: {
    host: getOsEnv('REDIS_HOST'),
    user: getOsEnv('REDIS_USER'),
    pass: getOsEnv('REDIS_PASS'),
    port: getOsEnv('REDIS_PORT'),
  },
  // postgres: {
  //   url: getOsEnv('POSTGRES_URL'),
  //   options: {
  //     user: getOsEnv('POSTGRES_USER'),
  //     pass: getOsEnv('POSTGRES_PASSWORD'),
  //   },
  // },
};
