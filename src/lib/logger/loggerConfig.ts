import { config } from '../config';

export const logLevel =
	config.isProduction || config.isDocker ? 'error' : 'debug';
export const logDirectory = config.log.directory || 'logs';

export const defaultScope = 'app';
