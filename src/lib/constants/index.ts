export const signals: ReadonlyArray<NodeJS.Signals> = ['SIGINT', 'SIGTERM'];

export * from './roles';

import path, { resolve } from 'path';
const STORAGE_BASE_PATH = 'uploads';

export const documentsPath = path.join(STORAGE_BASE_PATH, 'documents');
export const imagesPath = path.join(STORAGE_BASE_PATH, 'images');

// List of image file extensions
export const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
export const uploadsDir = resolve(__dirname, '..', '..', '..', 'uploads');
