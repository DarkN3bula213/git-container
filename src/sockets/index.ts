import { Logger } from '@/lib/logger';

const logger = new Logger(__filename);

import type { Server as HttpServer } from 'node:http';
import { type Socket, Server as SocketIOServer } from 'socket.io';
import { handleConnect, handleDisconnect } from './events';
import { corsOptions } from '@/lib/config/cors';

class SocketService {
  private io: SocketIOServer;
  private static instance: SocketService;

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: corsOptions,
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
      this.io.to(roomId).emit(eventName, message);
    } else {
      this.io.emit(eventName, message);
    }
  }

  private registerEvents(): void {
    this.io.on('connection', async (socket: Socket) => {
      logger.info({
        event: 'Socket connection attempt',
      });

      try {
        socket.on('connect', handleConnect);
        socket.onAny((event, ...args) => {
          logger.debug({
            event: event,
            arguments: JSON.stringify(args),
          });
        });
        socket.on('disconnect', () => handleDisconnect);
      } catch (error) {
        logger.error(`Error in socket connection: ${error}`);
      }
    });
  }
}

export default SocketService;
