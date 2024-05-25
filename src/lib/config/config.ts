import * as path from 'node:path';
import * as dotenv from 'dotenv';
import {
  getDecodedOsEnv,
  getOsEnv,
  getOsEnvOptional,
  normalizePort,
  toNumber,
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
  cors: {
    origin: 'http://localhost:5173/',
    credentials: true,

    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'x-api-key',
      'Authorization',
      'x-access-token',
    ],
    exposedHeaders: ['Set-Cookie'],
  },

  origin: getOsEnvOptional('ORIGIN_URL'),
  urlEncoded: {
    limit: '10mb',
    extended: true,
    parameterLimit: 50000,
  },
  json: {
    limit: '25mb',
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
    dev: `mongodb://${getOsEnv('DB_USER')}:${getOsEnv('DB_PASSWORD')}@127.0.0.1:${getOsEnv('DB_PORT')}/${getOsEnv('DB_NAME')}?authSource=admin`,
    docker: `mongodb://${getOsEnv('DB_USER')}:${getOsEnv('DB_PASSWORD')}@mongo:${getOsEnv('DB_PORT')}/${getOsEnv('DB_NAME')}?authSource=admin`,
  },
  redis: {
    host: getOsEnv('REDIS_HOST'),
    user: getOsEnv('REDIS_USER'),
    pass: getOsEnv('REDIS_PASS'),
    port: toNumber(getOsEnv('REDIS_PORT')),
    uri: getOsEnv('REDIS_URL'),
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
  cookieOptions: () => {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      domain: '.hps-admin.com',
    };
  },
  supabase: {
    url: getOsEnv('SUPABASE_URL'),
    key: getOsEnv('SUPABASE_KEY'),
  },
  mail: {
    host: getOsEnv('EMAIL_HOST'),
    port: toNumber(getOsEnv('EMAIL_PORT')),

    auth: {
      user: getOsEnv('EMAIL_USER'),
      pass: getOsEnv('EMAIL_PASS'),
    },
  },
};
