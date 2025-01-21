import { join } from 'path';
import { Logger } from '../logger';

export function getOsEnv(key: string): string {
	if (typeof process.env[key] === 'undefined') {
		if (process.env.NODE_ENV === 'production') {
			throw new Error(`Environment variable ${key} is not set.`);
		} else {
			const logger = new Logger(__filename);
			logger.error(`Environment variable ${key} is not set.`);
			return '';
		}
	}

	return process.env[key] as string;
}

export function getOsEnvOptional(key: string): string | undefined {
	return process.env[key];
}

export function getPath(path: string): string {
	return process.env.NODE_ENV === 'production'
		? join(
				process.cwd(),
				path.replace('src/', 'dist/').slice(0, -3) + '.js'
			)
		: join(process.cwd(), path);
}

export function getPaths(paths: string[]): string[] {
	return paths.map((p) => getPath(p));
}

export function getOsPath(key: string): string {
	return getPath(getOsEnv(key));
}

export function getOsPaths(key: string): string[] {
	return getPaths(getEnvArray(key));
}

export function toNumber(value: string): number {
	return parseInt(value, 10);
}

export function toBool(value: string): boolean {
	return value === 'true';
}

export function normalizePort(port: string): number | string | boolean {
	const parsedPort = parseInt(port, 10);
	if (isNaN(parsedPort)) {
		// named pipe
		return port;
	}
	if (parsedPort >= 0) {
		// port number
		return parsedPort;
	}
	return false;
}

export function getEnvArray(key: string, delimiter: string = ','): string[] {
	const envValue = process.env[key];
	return (envValue && envValue.split(delimiter)) || [];
}

export function decoded(key: string) {
	return Buffer.from(key, 'base64').toString('ascii');
}

export function getDecodedOsEnv(key: string): string {
	const envVar = getOsEnv(key);
	return decoded(envVar);
}

export const getDevelopmentEnv = (key: string, fallback: string): string => {
	if (process.env.NODE_ENV === 'development') {
		return getOsEnvOptional(key) || fallback;
	}
	return fallback;
};
