import type session from 'express-session';
import { cache } from '@/data/cache/cache.service';
import MongoStore from 'connect-mongo';
import { convertToMilliseconds } from '../utils/fns';
import { config } from '../config';

const URI = `mongodb://${config.mongo.user}:${encodeURIComponent(config.mongo.pass)}@127.0.0.1:${config.mongo.port}/${config.mongo.database}?authSource=admin`;

let conStr = '';

if (config.isDocker) {
  conStr = `mongodb://${config.mongo.user}:${encodeURIComponent(config.mongo.pass)}@mongo:${config.mongo.port}/${config.mongo.database}?authSource=admin`;
} else {
  conStr = URI;
}

export const sessionOptions: session.SessionOptions = {
  store: MongoStore.create({
    mongoUrl: conStr,
    ttl: convertToMilliseconds('2h'),
    autoRemove: 'native',
    collectionName: 'useSessions',
  }),
  secret: 'delayed-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: !config.isDevelopment,
    secure: !config.isDevelopment,
    sameSite: 'strict',
    path: '/',
    // domain: !config.isDevelopment ? '.hps-admin.com' : '',
    maxAge: convertToMilliseconds('2h'),
  },
};
