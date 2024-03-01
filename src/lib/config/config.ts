import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  getOsEnv,
  normalizePort,
  getOsEnvOptional,
  toNumber,
  getDecodedOsEnv,
  toBool,
} from './utils';

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
  isJest: process.env.NODE_ENV === 'jest',
  disengage: process.env.DISENGAGE || 'false',
  isDocker: process.env.NODE_ENV === 'docker',
  isDevelopment: process.env.NODE_ENV === 'development',
  app: {
    port: normalizePort(process.env.PORT || getOsEnv('PORT')),
  },
  cors: () => {
    return {
      origin: '*',
      methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
      allowedHeaders: 'x-access-token, x-refresh-token, Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key',
      credentials: true,
      optionsSuccessStatus: 204,
    };
  },
  corsOptions: {
    exposedHeaders: ['x-access-token', 'x-refresh-token'],
    credentials: true,
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    optionsSuccessStatus: 200,
  },
  urlEncoded: {
    limit: '10mb',
    extended: true,
    parameterLimit: 50000,
  },
  json: {
    limit: '10mb',
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
    uri: getOsEnv('REDIS_URI_DEV'),
  },
  tokens: {
    jwtSecret: getOsEnv('JWT_SECRET'),
    access: {
      private: getDecodedOsEnv('ACCESS_PRIVATE'),
      public: getDecodedOsEnv('ACCESS_PUBLIC'),
      ttl: getOsEnv('ACCESS_TTL'),
    },
    refresh: {
      private: getDecodedOsEnv('REFRESH_PRIVATE'),
      public: getDecodedOsEnv('REFRESH_PUBLIC'),
      ttl: getOsEnv('REFRESH_TTL'),
    },
  },
  // postgres: {
  //   url: getOsEnv('POSTGRES_URL'),
  //   options: {
  //     user: getOsEnv('POSTGRES_USER'),
  //     pass: getOsEnv('POSTGRES_PASSWORD'),
  //   },
  // },
};
