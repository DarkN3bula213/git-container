import path, { resolve } from 'node:path';
import { config } from '../config';

export const signals: ReadonlyArray<NodeJS.Signals> = ['SIGINT', 'SIGTERM'];

export * from './roles';

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
		password: undefined
	}
} as const;
export const banner = `
__/\\________/\\__/\\\\\\\\\\\\\\_______/\\\\\\______ 
 _\\/\\_______\\/\\_\\/\\////////\\__//\\_\\\\\\\\\\\\\\__
  _\\/\\_______\\/\\_\\/\\_______\\/\\__\\\\\\\\\\\\\\\\________________
   _\\/\\\\\\\\\\\\\\_\\/\\\\\\\\\\\\)))))))___\\/\\\\\\(((((/____
    _\\/////////\\_\\/\\/////////_______________\\\\\\\\__
     _\\/\\_______\\/\\_\\/\\______________\\________\\\\__
      _\\/\\_______\\/\\_\\/\\_____________/\\_____))))))____\\/_________
       _\\/\\_______\\/\\_\\/________________/\\\\\\\\\\\\\\___
        _///________///__///________________//_________________
`;
