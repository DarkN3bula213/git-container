import { socketParser } from '@/sockets';

interface Notification {
	event: string;
	message: string;
}

export const notify = (notification: Notification) => {
	socketParser.emit(notification.event, {
		message: notification.message,
		timestamp: new Date().toISOString()
	});
};
