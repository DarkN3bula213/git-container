import { Logger } from '@/lib/logger';
import { Server, Socket } from 'socket.io';
import { emitMessage } from '../utils/emitMessage';

const logger = new Logger(__filename);

const socketEvents = {
	startImageTransfer: 'startImageTransfer',
	imageChunk: 'imageChunk',
	chunkAck: 'chunkAck',
	imageTransferError: 'imageTransferError',
	completeImageTransfer: 'completeImageTransfer'
} as const;

export const handleImageTransfer = (socket: Socket, io: Server) => {
	socket.on(
		socketEvents.startImageTransfer,
		handleStartImageTransfer(socket, io)
	);
	socket.on(socketEvents.imageChunk, handleImageChunk(socket, io));

	socket.on(
		socketEvents.completeImageTransfer,
		handleCompleteImageTransfer(io, socket)
	);
};

// Initiate image transfer
const handleStartImageTransfer =
	(socket: Socket, io: Server) =>
	async ({
		toUserId,
		totalChunks,
		fileName,
		fileType
	}: {
		toUserId: string;
		totalChunks: number;
		fileName: string;
		fileType: string;
	}) => {
		try {
			emitMessage(io, {
				receivers: [toUserId],
				event: socketEvents.startImageTransfer,
				payload: { fileName, fileType, totalChunks }
			});
			logger.info(`Starting image transfer to user ${toUserId}`);
		} catch (error) {
			logger.error('Error starting image transfer', error);
			socket.emit(socketEvents.imageTransferError, {
				message: 'Failed to initiate image transfer'
			});
		}
	};

// Handle each image chunk
const handleImageChunk =
	(socket: Socket, io: Server) =>
	async ({
		toUserId,
		conversationId,
		chunk,
		chunkIndex,
		totalChunks
	}: {
		toUserId: string;
		conversationId: string;
		chunk: ArrayBuffer;
		chunkIndex: number;
		totalChunks: number;
	}) => {
		try {
			// Forward the chunk to the recipient
			emitMessage(io, {
				receivers: [toUserId],
				event: socketEvents.imageChunk,
				payload: { conversationId, chunk, chunkIndex, totalChunks }
			});

			// Notify sender of successful chunk transmission
			socket.emit(socketEvents.chunkAck, { chunkIndex });

			logger.info(
				`Chunk ${chunkIndex + 1}/${totalChunks} sent to user ${toUserId}`
			);
		} catch (error) {
			logger.error('Error transferring image chunk', error);
			socket.emit(socketEvents.imageTransferError, {
				message: 'Failed to transfer image chunk',
				chunkIndex
			});
		}
	};

// Complete the image transfer
const handleCompleteImageTransfer =
	(io: Server, socket: Socket) =>
	async ({
		toUserId,
		conversationId
	}: {
		toUserId: string;
		conversationId: string;
	}) => {
		const fromUserId = socket.data.userId as string;

		try {
			// Notify the recipient that the transfer is complete
			emitMessage(io, {
				receivers: [toUserId],
				event: socketEvents.completeImageTransfer,
				payload: { conversationId, senderId: fromUserId }
			});

			logger.info(`Image transfer complete to user ${toUserId}`);
		} catch (error) {
			logger.error('Error completing image transfer', error);
			socket.emit(socketEvents.imageTransferError, {
				message: 'Failed to complete image transfer'
			});
		}
	};
