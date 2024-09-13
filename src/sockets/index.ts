import { Logger } from '@/lib/logger';

const logger = new Logger(__filename);

import type { Server as HttpServer } from 'node:http';
import { type Socket, Server as SocketIOServer } from 'socket.io';
import { handleConnect, handleDisconnect } from './events';
import { corsOptions } from '@/lib/config/cors';
import { cache } from '@/data/cache/cache.service';
import { config } from '@/lib/config';

class SocketService {
  private io: SocketIOServer;
  connectedUsers = new Map<
    string,
    { userId: string; username: string; socketId: string }
  >();
  private static instance: SocketService;
  sessionMiddleware = cache.cachedSession(config.tokens.jwtSecret);

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: corsOptions,
    });
    this.io.engine.use(this.sessionMiddleware);
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
      try {
        // No need for socket.on('connect', ...), the connection is already established

        // Handle the connection logic immediately
        await handleConnect(socket, this.io, this.connectedUsers);

        socket.onAny((event, ...args) => {
          logger.debug({
            event: event,
            socketId: socket.id,
            arguments: JSON.stringify(args),
          });
        });

        socket.on('disconnect', async () => {
          try {
            await handleDisconnect(socket, this.io, this.connectedUsers);
          } catch (error: any) {
            logger.error(
              `Error in handleDisconnect for socket ${socket.id}: ${error.message}`,
            );
          }
        });
      } catch (error: any) {
        logger.error(
          `Error during connection setup for socket ${socket.id}: ${error.message}`,
        );
      }
    });
  }
}

export default SocketService;
