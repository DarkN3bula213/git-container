import { Logger } from '@/lib/logger';
import cookie from 'cookie';
import type { Request } from 'express';
import type { Socket } from 'socket.io';

const logger = new Logger('extractToken');

export const extractToken = (source: Socket | Request): string | null => {
	try {
		if ('handshake' in source) {
			// Socket case
			const cookies = cookie.parse(source.handshake.headers.cookie || '');
			const authHeader = source.handshake.headers.authorization;

			const authFromHandshake = source.handshake.auth?.token;

			const token =
				cookies.access ||
				(authHeader?.startsWith('Bearer ')
					? authHeader.split(' ')[1]
					: authHeader) ||
				(authFromHandshake?.startsWith('Bearer ')
					? authFromHandshake.split(' ')[1]
					: authFromHandshake);

			logger.debug(`Token extracted: ${token}`);

			return token;
		} else {
			// Express Request case
			const cookies = cookie.parse(source.headers.cookie || '');
			const authHeader = source.headers.authorization;

			const token =
				cookies.access ||
				(authHeader?.startsWith('Bearer ')
					? authHeader.split(' ')[1]
					: authHeader);

			logger.debug(`Token extracted: ${token}`);

			return token || null;
		}
	} catch (error) {
		logger.error('Token extraction failed:', error);
		return null;
	}
};
