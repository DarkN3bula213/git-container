import { ProductionLogger } from '@/lib/logger/v1/logger';
import { socketParser } from '@/sockets';

const logger = new ProductionLogger('socketParser');

interface Notification {
	event: string;
	message: string;
}
export const notify = (notification: Notification) => {
	try {
		if (!socketParser) {
			throw new Error('Socket server not initialized');
		}

		logger.info({
			message: 'notify',
			notification: notification,
			event: notification.event // log the specific event name
		});

		// Broadcast to all connected clients
		socketParser.emit(notification.event, {
			message: notification.message,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logger.error({
			message: 'Failed to send notification',
			error: error instanceof Error ? error.message : 'Unknown error',
			notification
		});
	}
};
