import { corsOptions } from '@/lib/config/cors';
import { Logger } from '@/lib/logger';
import { verifyToken } from '@/lib/utils/tokens';
import cookie from 'cookie';

const logger = new Logger(__filename);

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import UserSessionModel from './session.model';

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

  private registerEvents(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info({
        event: 'Socket connection attempt',
      });
      try {
        const cookies = cookie.parse(socket.handshake.headers.cookie || '');

        const authToken = cookies['access'];

        if (!authToken) {
          socket.disconnect();
          return;
        }

        const verificationResult = verifyToken(authToken, 'access');
        if (!verificationResult.valid) {
          logger.warn(`Invalid auth token from cookies, disconnecting socket.`);
          socket.disconnect();
          return;
        } else {
          logger.info(
            `User ${verificationResult.decoded?.user.name} connected`,
          );
        }
        socket.on('joinPaymentRoom', (roomId) => {
          logger.info(`User ${userID} joined payment room ${roomId}`);
          socket.join(`paymentRoom-${roomId}`);
        });
        const startTime = new Date();
        const userID = verificationResult.decoded?.user._id;

        socket.on('disconnect', () => {
          const endTime = new Date();
          const timeSpent = (endTime.getTime() - startTime.getTime()) / 1000;

          // time spent in hrs , mins and seconds
          const hours = Math.floor(timeSpent / 3600);
          const minutes = Math.floor((timeSpent % 3600) / 60);
          const seconds = Math.floor(timeSpent % 60);
          const time = `${hours}h ${minutes}m ${seconds}s`;
          logger.info({
            event: 'User disconnected',
            userID: userID,
            timeSpent: `${hours}h ${minutes}m ${seconds}s`,
          });
          this.saveUserSession(userID, startTime, endTime, time);
        });
      } catch (error) {
        logger.error(`Error in socket connection: ${error}`);
      }
    });
  }

  private async saveUserSession(
    userID: string,
    startTime: Date,
    endTime: Date,
    timeSpent: string,
  ): Promise<void> {
    try {
      const session = new UserSessionModel({
        userID,
        startTime,
        endTime,
        timeSpent,
      });
      await session.save();
      logger.info(`Session saved for user ${userID}`);
    } catch (error) {
      logger.error(`Error saving session for user ${userID}: ${error}`);
    }
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
