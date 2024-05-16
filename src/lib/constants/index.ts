export const signals: ReadonlyArray<NodeJS.Signals> = ['SIGINT', 'SIGTERM'];

export * from './roles';

import path, { resolve } from 'path';
import { config } from '../config';
const STORAGE_BASE_PATH = 'uploads';

export const documentsPath = path.join(STORAGE_BASE_PATH, 'documents');
export const imagesPath = path.join(STORAGE_BASE_PATH, 'images');

// List of image file extensions
export const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
export const uploadsDir = resolve(__dirname, '..', '..', '..', 'uploads');

export const redisOptions = {
  redis: {
    host: config.isDevelopment
      ? 'localhost'
      : process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379),
  },
} as const;
