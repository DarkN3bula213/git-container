import { Server } from 'socket.io';

export const emitMessage = (
	io: Server,
	{
		receivers,
		event,
		payload
	}: {
		receivers: string[];
		event: string;
		payload: object;
	}
) => {
	receivers.forEach((receiverId) => {
		io.to(receiverId).emit(event, payload);
	});
};
