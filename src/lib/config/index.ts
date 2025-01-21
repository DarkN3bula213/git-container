export * from './morgan';
export * from './multer';
export * from './rate-limit';
export { config } from './config';

// You can also add a function to explicitly initialize the config if needed
export async function initializeConfig() {
	return import('./config').then(({ config }) => config);
}
