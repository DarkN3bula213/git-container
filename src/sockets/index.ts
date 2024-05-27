import { Logger } from '@/lib/logger';
import { verifyToken } from '@/lib/utils/tokens';
import cookie from 'cookie';

const logger = new Logger(__filename);

import type { Server as HttpServer } from 'node:http';
import { type Socket, Server as SocketIOServer } from 'socket.io';
import { handleDisconnect } from './socket.utils';

class SocketService {
  private io: SocketIOServer;
  private static instance: SocketService;

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: 'https://hps-admin.com',
        credentials: true,
        preflightContinue: true,
        optionsSuccessStatus: 204,
        methods: ['GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'x-api-key',
          'Authorization',
          'x-access-token',
        ],
        exposedHeaders: ['Set-Cookie'],
      },
    });
    this.registerEvents();
  }

  public static getInstance(httpServer?: HttpServer): SocketService {
    if (!SocketService.instance && httpServer) {
      SocketService.instance = new SocketService(httpServer);
    }
    return SocketService.instance;
  }
  public emit(eventName: string, message: any, roomId?: string): void {
    if (roomId) {
      // Emit to a specific roomhttps://biomejs.dev/linter/rules/no-explicit-any
      this.io.to(roomId).emit(eventName, message);
    } else {
      // Broadcast to all connected sockets
      this.io.emit(eventName, message);
    }
  }

  private registerEvents(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info({
        event: 'Socket connection attempt',
      });

      try {
        const cookies = cookie.parse(socket.handshake.headers.cookie || '');
        const authToken = cookies.access;

        if (!authToken) {
          socket.disconnect();
          return;
        }

        const verificationResult = verifyToken(authToken, 'access');
        if (!verificationResult.valid) {
          logger.warn('Invalid auth token from cookies, disconnecting socket.');
          socket.disconnect();
          return;
        }
        const userID = verificationResult.decoded?.user._id;
        logger.info(`User ${verificationResult.decoded?.user.name} connected`);

        // Remove existing save session job if reconnecting
        // removeSaveSessionJob(userID);

        socket.on('joinPaymentRoom', (roomId) => {
          logger.info(`User ${userID} joined payment room ${roomId}`);
          socket.join(`paymentRoom-${roomId}`);
        });

        socket.on('disconnect', () => handleDisconnect);
      } catch (error) {
        logger.error(`Error in socket connection: ${error}`);
      }
    });
  }

  public notifyPaymentSuccess(jobId: string, result: any) {
    try {
      this.io.to(`paymentRoom-${jobId}`).emit('paymentSuccess', {
        jobId,
        message: 'Payment processed successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error(error);
    }
  }

  // Call this method when a payment fails
  public notifyPaymentFailure(jobId: string, error: any) {
    try {
      this.io.to(`paymentRoom-${jobId}`).emit('paymentFailure', {
        jobId,
        message: 'Payment processing failed',
        error,
      });
    } catch (error: any) {
      logger.error(error);
    }
  }
}

export default SocketService;
