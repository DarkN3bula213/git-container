import { config } from '../config';

export const logLevel = config.log.level;
export const logDirectory = config.log.directory || 'logs';

export const defaultScope = 'app';
