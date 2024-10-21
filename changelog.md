### `socketParser` Documentation

---

#### **Overview**

The `socketParser` is a globally available instance of the `Socket.IO` server that facilitates real-time, bidirectional communication between the server and connected clients. This instance allows the broadcasting of messages and events to all connected clients or specific rooms, and it is integrated seamlessly into an Express-based application.

By decoupling the socket logic from individual routes and controllers, `socketParser` enables the broadcasting of events from anywhere within the application. It’s designed to be used in middleware, controllers, or anywhere the `Socket.IO` instance is needed.

---

### **Motivation**

Real-time communication is a critical feature in modern web applications, providing functionalities such as notifications, live updates, and user interaction. Typically, implementing `Socket.IO` requires the management of the socket server instance alongside HTTP servers and middleware logic, which can lead to repetitive or complex code structures.

The **motivation** behind `socketParser` is to:
1. Provide a **singleton** `Socket.IO` server instance that can be reused across the entire application.
2. Ensure **separation of concerns**, allowing route handlers and controllers to handle business logic without managing socket connections.
3. Facilitate **asynchronous communication** from the server to clients by broadcasting events based on the state of the application (e.g., revenue changes, user activity updates).
4. Avoid redundant socket connections and streamline the use of the socket instance.

---

### **Use Cases**

`socketParser` can be used for various real-time features, including but not limited to:

1. **Broadcasting Notifications**:
   - When specific server-side events occur (e.g., a user submits a form or a revenue change is detected), you can broadcast a notification to all connected clients.

   ```typescript
   socketParser.emit('notification', {
       message: 'A new message from the server!',
       timestamp: new Date().toISOString()
   });
   ```

2. **Room-Based Communication**:
   - You can emit events to specific rooms or groups of clients. For example, broadcasting updates only to clients subscribed to a particular room.

   ```typescript
   socketParser.to('admin-room').emit('adminNotification', {
       message: 'Admin-only notification',
       timestamp: new Date().toISOString()
   });
   ```

3. **Real-Time Updates**:
   - Sending live data updates (e.g., stock prices, sports scores, or dashboard metrics) to clients when a change occurs on the server.

   ```typescript
   socketParser.emit('dashboardUpdate', {
       metric: 'Total Sales',
       value: 1000
   });
   ```

4. **User Activity Tracking**:
   - Emitting user activity (e.g., when a user logs in or logs out) to notify other users or update the UI.

   ```typescript
   socketParser.emit('userActivity', {
       userId: '123',
       action: 'logged in',
       timestamp: new Date().toISOString()
   });
   ```

---

### **Error Handling**

When dealing with real-time communication, error handling is critical to ensure that the system remains reliable and resilient. Here are strategies for managing errors in `socketParser`:

1. **Socket Connection Errors**:
   - Ensure proper error handling for connection and disconnection events using the `error` event listener.

   ```typescript
   socketParser.on('error', (err) => {
       console.error('Socket error:', err);
   });
   ```

2. **Broadcasting Failures**:
   - In cases where broadcasting to clients might fail (e.g., socket disconnection during a broadcast), you should log or handle the failure.

   ```typescript
   try {
       socketParser.emit('notification', {
           message: 'Server broadcast',
           timestamp: new Date().toISOString()
       });
   } catch (error) {
       console.error('Failed to broadcast event:', error);
   }
   ```

3. **Middleware-Level Error Handling**:
   - In middleware functions, errors during the broadcast should be caught and properly handled to avoid disrupting the normal request-response cycle.

   ```typescript
   res.on('finish', async () => {
       try {
           socketParser.emit('notification', { message: 'Event' });
       } catch (error) {
           console.error('Error during socket emission:', error);
       }
   });
   ```

---

### **Async Considerations**

Many server-side operations are asynchronous, especially when interacting with databases, caches, or external APIs. To handle async operations with `socketParser`, it’s important to ensure that asynchronous code is properly awaited before emitting events to clients.

#### Best Practices for Async Operations:
1. **Await Async Functions Before Emitting**:
   - When fetching data asynchronously, ensure that the data is ready before broadcasting the event.

   ```typescript
   res.on('finish', async () => {
       try {
           const result = await fetchData(); // Async operation
           socketParser.emit('notification', {
               message: `Data fetched: ${result}`,
               timestamp: new Date().toISOString()
           });
       } catch (error) {
           console.error('Error broadcasting data:', error);
       }
   });
   ```

2. **Handling Async Failures**:
   - Always wrap async operations in `try/catch` blocks to ensure that failures are logged and don’t silently cause issues.

   ```typescript
   res.on('finish', async () => {
       try {
           await someAsyncFunction();
           socketParser.emit('event', { message: 'Success' });
       } catch (error) {
           console.error('Error in async operation:', error);
       }
   });
   ```

---

### **Refined Implementation**

#### **Global SocketIO Server (`socketService.ts`)**

```typescript
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { corsOptions } from './config';
import { cache } from './cache';

export let socketParser: SocketIOServer; // Exported Socket.IO instance

class SocketService {
    private io: SocketIOServer;
    private static instance: SocketService;

    constructor(httpServer: HttpServer) {
        this.io = new SocketIOServer(httpServer, { cors: corsOptions });
        socketParser = this.io; // Set global instance

        // Setup socket event listeners
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        this.io.on('error', (err) => {
            console.error('Socket.IO error:', err);
        });
    }

    // Singleton pattern
    public static init(httpServer: HttpServer): SocketService {
        if (!this.instance) {
            this.instance = new SocketService(httpServer);
        }
        return this.instance;
    }
}

export default SocketService;
```

#### **Broadcasting Middleware (`broadcastMiddleware.ts`)**

```typescript
import { Request, Response, NextFunction } from 'express';
import { socketParser } from './socketService';
import { cache } from './cache';
import { Key } from './cacheKeys';

export const broadcastOnResponseFinish = (event: string, generateMessage: (req: Request, res: Response) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        res.on('finish', async () => {
            try {
                const message = await generateMessage(req, res);
                socketParser.emit(event, message);
            } catch (error) {
                console.error('Error broadcasting event:', error);
            }
        });
        next();
    };
};
```

#### **Route Example**

```typescript
import express from 'express';
import { broadcastOnResponseFinish } from './broadcastMiddleware';

const router = express.Router();

const generateRevenueMessage = async (req: Request, res: Response) => {
    const key = Key.DAILYTOTAL;
    const totalAmount = await cache.get<number>(key);
    return {
        message: `Total revenue changed to $${totalAmount}`,
        timestamp: new Date().toISOString()
    };
};

router.get('/update-revenue', broadcastOnResponseFinish('notification', generateRevenueMessage), (req, res) => {
    res.send('Revenue updated');
});

export default router;
```

---

### **Conclusion**

The `socketParser` feature provides a robust, reusable, and extensible solution for broadcasting real-time events across an application. By decoupling the socket logic from individual routes and controllers, it enables clean separation of concerns and allows for asynchronous and scalable handling of real-time communication in Node.js and Express applications.

 <div className="space-y-2">
                <p className="text-sm">Key Metrics</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between border-b border-control py-1">
                    <p className="text-xs text-foreground-light">
                      
                    </p>
                    <p className="text-xs">Random </p>
                  </div>
                  <div className="flex items-center justify-between border-b border-control py-1">
                    <p className="text-xs text-foreground-light">
                    Total Enrollments (active students)
                      Month to Date Revenue
                      Last Month Revenue
                      This month week 1 2 3 4
                      Last month week 1 2 3 4
                      Change in student strength
                    Last month collection target real
                    This month collection target achieved
                    </p>
                    <p className="text-xs">Random</p>
                  </div>
                  <div className="flex items-center justify-between border-b border-control py-1">
                    <p className="text-xs text-foreground-light">
                      Months Enrollments
                    </p>
                    <p className="text-xs">Random</p>
                  </div>
                  <div className="flex items-center justify-between border-b border-control py-1">
                    <p className="text-xs text-foreground-light">
                      Months Revenue
                    </p>
                    <p className="text-xs">Random</p>
                  </div>
                  <div className="flex items-center justify-between border-b border-control py-1">
                    <p className="text-xs text-foreground-light">
                      Past weeks Enrollments
                    </p>
                    <p className="text-xs">Random</p>
                  </div>
                  <div className="flex items-center justify-between border-b border-control py-1">
                    <p className="text-xs text-foreground-light">
                      Past weeks Revenue
                    </p>
                    <p className="text-xs">Random</p>
                  </div>
                  <div className="flex items-center justify-between border-b border-control py-1">
                    <p className="text-xs text-foreground-light">
                      Last months Enrollments
                    </p>
                    <p className="text-xs">Random</p>
                  </div>
                  <div className="flex items-center justify-between border-b border-control py-1">
                    <p className="text-xs text-foreground-light">
                      Last months Revenue
                    </p>
                    <p className="text-xs">Random</p>
                  </div>
                </div>
              </div>


              docker exec -it mongodb_container_name mongodump --archive=/dump/mongo_dump.tz --gzip && docker cp mongodb_container_name:/dump/mongo_dump.tz ./ && tar -tvf mongo_dump.tz∫


              docker exec -it 361daead07f6 mongorestore --username devuser --password devpassword --authenticationDatabase admin --db docker-db --gzip --archive=backup-2024-10-


function SelectOption({ icon, label, description }: MediaItem) {
  return (
    <Group>
      <Text fz={20}>{icon}</Text>
      <div>
        <Text fz="sm" fw={500}>
          {label}
        </Text>
        <Text fz="xs" opacity={0.6}>
          {kind}
        </Text>
      </div>
    </Group>
  );
}


```ts
import { SocketIOServer, Socket } from 'socket.io';
import { HttpServer } from 'http';
import { logger } from '@/lib/logger';
import { handleAuth, handleUsers, handleMessages, handleDisconnect } from '@/modules/socket/handlers';
import { corsOptions, config } from '@/config';
import { removeSaveSessionJob } from '@/modules/socket/utils';

class SocketService {
    private io: SocketIOServer;
    connectedUsers = new Map<string, { userId: string; username: string; socketId: string }>();
    private static instance: SocketService;

    constructor(httpServer: HttpServer) {
        this.io = new SocketIOServer(httpServer, {
            serveClient: false,
            pingInterval: 10000,
            pingTimeout: 5000,
            cors: corsOptions
        });

        this.io.engine.use(cache.cachedSession(config.tokens.jwtSecret));

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

    public emitToSocket(socketId: string, eventName: string, message: any): void {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
            socket.emit(eventName, message);
        } else {
            logger.warn(`Socket ${socketId} not found`);
        }
    }

    private registerEvents(): void {
        this.io.on('connection', async (socket: Socket) => {
            try {
                const authResult = await handleAuth(socket);
                if (!authResult) return;

                await removeSaveSessionJob(socket.data.userId);
                await handleUsers(socket, this.connectedUsers);
                await handleMessages(socket, this.io, this.connectedUsers);

                // WebRTC related event listeners
                this.setupWebRTCListeners(socket);

                socket.onAny((event, ...args) => {
                    if (event !== 'joinConversation') {
                        logger.warn({
                            event: event,
                            arguments: JSON.stringify(args, null, 2)
                        });
                    }
                });

                socket.onAnyOutgoing((event, ...args) => {
                    if (event !== 'init') {
                        logger.debug({
                            outgoing: `Outgoing ${event}`,
                            arguments: JSON.stringify(args, null, 2)
                        });
                    } else {
                        logger.debug({
                            outgoing: `Outgoing ${event}`
                        });
                    }
                });

                socket.on('disconnect', async () => {
                    try {
                        await handleDisconnect(socket, this.io, this.connectedUsers);
                    } catch (error: any) {
                        logger.error(`Error in handleDisconnect for socket ${socket.id}: ${error.message}`);
                    }
                });
            } catch (error: any) {
                logger.error(`Error during connection setup for socket ${socket.id}: ${error.message}`);
            }
        });
    }

    private setupWebRTCListeners(socket: Socket): void {
        // Handle signaling for video chat
        socket.on('video-offer', (data: { target: string; sdp: RTCSessionDescriptionInit }) => {
            this.emitToSocket(data.target, 'video-offer', { from: socket.id, sdp: data.sdp });
        });

        socket.on('video-answer', (data: { target: string; sdp: RTCSessionDescriptionInit }) => {
            this.emitToSocket(data.target, 'video-answer', { from: socket.id, sdp: data.sdp });
        });

        socket.on('new-ice-candidate', (data: { target: string; candidate: RTCIceCandidateInit }) => {
            this.emitToSocket(data.target, 'new-ice-candidate', { from: socket.id, candidate: data.candidate });
        });

        // Handle screen sharing
        socket.on('start-screen-share', (data: { target: string }) => {
            this.emitToSocket(data.target, 'start-screen-share', { from: socket.id });
        });

        socket.on('stop-screen-share', (data: { target: string }) => {
            this.emitToSocket(data.target, 'stop-screen-share', { from: socket.id });
        });

        // Handle file sharing (metadata only, actual file transfer will be handled separately)
        socket.on('file-metadata', (data: { target: string; metadata: { name: string, size: number, type: string } }) => {
            this.emitToSocket(data.target, 'file-metadata', { from: socket.id, metadata: data.metadata });
        });

        // Handle file transfer acceptance
        socket.on('file-transfer-accepted', (data: { target: string, fileId: string }) => {
            this.emitToSocket(data.target, 'file-transfer-accepted', { from: socket.id, fileId: data.fileId });
        });

        // Handle file transfer rejection
        socket.on('file-transfer-rejected', (data: { target: string, fileId: string }) => {
            this.emitToSocket(data.target, 'file-transfer-rejected', { from: socket.id, fileId: data.fileId });
        });
    }
    private setupWebRTCListeners(socket: Socket): void {
        // Handle signaling for video chat
        socket.on('video-offer', (data: { target: string; sdp: RTCSessionDescriptionInit }) => {
            this.emitToSocket(data.target, 'video-offer', { from: socket.id, sdp: data.sdp });
        });

        socket.on('video-answer', (data: { target: string; sdp: RTCSessionDescriptionInit }) => {
            this.emitToSocket(data.target, 'video-answer', { from: socket.id, sdp: data.sdp });
        });

        socket.on('new-ice-candidate', (data: { target: string; candidate: RTCIceCandidateInit }) => {
            this.emitToSocket(data.target, 'new-ice-candidate', { from: socket.id, candidate: data.candidate });
        });

        // Handle screen sharing
        socket.on('start-screen-share', (data: { target: string }) => {
            this.emitToSocket(data.target, 'start-screen-share', { from: socket.id });
        });

        socket.on('stop-screen-share', (data: { target: string }) => {
            this.emitToSocket(data.target, 'stop-screen-share', { from: socket.id });
        });

        // Handle file sharing (metadata only, actual file transfer will be handled separately)
        socket.on('file-metadata', (data: { target: string; metadata: { name: string, size: number, type: string } }) => {
            this.emitToSocket(data.target, 'file-metadata', { from: socket.id, metadata: data.metadata });
        });

        // Handle file transfer acceptance
        socket.on('file-transfer-accepted', (data: { target: string, fileId: string }) => {
            this.emitToSocket(data.target, 'file-transfer-accepted', { from: socket.id, fileId: data.fileId });
        });

        // Handle file transfer rejection
        socket.on('file-transfer-rejected', (data: { target: string, fileId: string }) => {
            this.emitToSocket(data.target, 'file-transfer-rejected', { from: socket.id, fileId: data.fileId });
        });
    }
}

export default SocketService;

import { Server as SocketIOServer, Socket } from 'socket.io';
import { HttpServer } from 'http';
import { Logger } from '@/lib/logger';
import { handleAuth, handleUsers, handleMessages, handleDisconnect } from '@/modules/socket/handlers';
import { corsOptions, config } from '@/config';
import { removeSaveSessionJob } from '@/modules/socket/utils';
import { emitMessage } from '@/modules/socket/utils/emitMessage';

const logger = new Logger(__filename);

class SocketService {
    private io: SocketIOServer;
    connectedUsers = new Map<string, { userId: string; username: string; socketId: string }>();
    private static instance: SocketService;

    constructor(httpServer: HttpServer) {
        this.io = new SocketIOServer(httpServer, {
            serveClient: false,
            pingInterval: 10000,
            pingTimeout: 5000,
            cors: corsOptions
        });

        this.io.engine.use(cache.cachedSession(config.tokens.jwtSecret));

        this.registerEvents();
    }

    public static getInstance(httpServer?: HttpServer): SocketService {
        if (!SocketService.instance && httpServer) {
            SocketService.instance = new SocketService(httpServer);
        }
        return SocketService.instance;
    }

    private registerEvents(): void {
        this.io.on('connection', async (socket: Socket) => {
            try {
                const authResult = await handleAuth(socket);
                if (!authResult) return;

                await removeSaveSessionJob(socket.data.userId);
                await handleUsers(socket, this.connectedUsers);
                await handleMessages(socket, this.io, this.connectedUsers);

                // WebRTC related event listeners
                this.setupWebRTCListeners(socket);

                socket.onAny((event, ...args) => {
                    if (event !== 'joinConversation') {
                        logger.warn({
                            event: event,
                            arguments: JSON.stringify(args, null, 2)
                        });
                    }
                });

                socket.onAnyOutgoing((event, ...args) => {
                    if (event !== 'init') {
                        logger.debug({
                            outgoing: `Outgoing ${event}`,
                            arguments: JSON.stringify(args, null, 2)
                        });
                    } else {
                        logger.debug({
                            outgoing: `Outgoing ${event}`
                        });
                    }
                });

                socket.on('disconnect', async () => {
                    try {
                        await handleDisconnect(socket, this.io, this.connectedUsers);
                    } catch (error: any) {
                        logger.error(`Error in handleDisconnect for socket ${socket.id}: ${error.message}`);
                    }
                });
            } catch (error: any) {
                logger.error(`Error during connection setup for socket ${socket.id}: ${error.message}`);
            }
        });
    }

    private setupWebRTCListeners(socket: Socket): void {
        // Handle signaling for video chat
        socket.on('video-offer', (data: { targetSessionId: string; sdp: RTCSessionDescriptionInit }) => {
            this.handleWebRTCSignal(socket, 'video-offer', data);
        });

        socket.on('video-answer', (data: { targetSessionId: string; sdp: RTCSessionDescriptionInit }) => {
            this.handleWebRTCSignal(socket, 'video-answer', data);
        });

        socket.on('new-ice-candidate', (data: { targetSessionId: string; candidate: RTCIceCandidateInit }) => {
            this.handleWebRTCSignal(socket, 'new-ice-candidate', data);
        });

        // Handle screen sharing
        socket.on('start-screen-share', (data: { targetSessionId: string }) => {
            this.handleWebRTCSignal(socket, 'start-screen-share', data);
        });

        socket.on('stop-screen-share', (data: { targetSessionId: string }) => {
            this.handleWebRTCSignal(socket, 'stop-screen-share', data);
        });

        // Handle file sharing (metadata only, actual file transfer will be handled separately)
        socket.on('file-metadata', (data: { targetSessionId: string; metadata: { name: string, size: number, type: string } }) => {
            this.handleWebRTCSignal(socket, 'file-metadata', data);
        });

        // Handle file transfer acceptance
        socket.on('file-transfer-accepted', (data: { targetSessionId: string, fileId: string }) => {
            this.handleWebRTCSignal(socket, 'file-transfer-accepted', data);
        });

        // Handle file transfer rejection
        socket.on('file-transfer-rejected', (data: { targetSessionId: string, fileId: string }) => {
            this.handleWebRTCSignal(socket, 'file-transfer-rejected', data);
        });
    }

    private handleWebRTCSignal(socket: Socket, eventName: string, data: any): void {
        const sourceSessionId = socket.data.sessionId as string;
        const sourceUserId = socket.data.userId as string;
        const { targetSessionId, ...payload } = data;

        if (!sourceSessionId || !sourceUserId || !targetSessionId) {
            logger.error(`Invalid WebRTC signal data for event ${eventName}`);
            return;
        }

        const targetUser = this.connectedUsers.get(targetSessionId);
        if (!targetUser) {
            logger.warn(`Target user with sessionId ${targetSessionId} not found for event ${eventName}`);
            return;
        }

        emitMessage(this.io, {
            receivers: [targetUser.userId],
            event: eventName,
            payload: {
                ...payload,
                from: {
                    sessionId: sourceSessionId,
                    userId: sourceUserId,
                    username: socket.data.username
                }
            }
        });

        logger.info(`WebRTC ${eventName} signal sent from ${sourceUserId} to ${targetUser.userId}`);
    }
}

export default SocketService;


import {
  ChatMessage,
  ChatUser,
  Conversation,
  SystemMessage,
  useChatStore,
} from '../store/chatStore';
import events from '@/constants/socket-events';
import { useToastStore } from '@/context/toastContext';
import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import React from 'react';
import { useVideoCall } from '@/hooks/useVideoCall';
import { useVideoCallStore } from '@/store/videoCallStore';
import { useChatStore } from '@/store/chatStore';
import { useSocket } from '@/hooks/useSocket'; // Assume you have this hook to get the socket instance

// Call Action Buttons Component
const CallActionButtons: React.FC = () => {
  const socket = useSocket();
  const { startCall, answerCall, rejectCall, endCall } = useVideoCall({ socket });
  const callStatus = useVideoCallStore(state => state.callStatus);
  const incomingCall = useVideoCallStore(state => state.incomingCall);
  const selectedUser = useChatStore(state => state.selectedUser);

  if (callStatus === 'idle' && !incomingCall) {
    return (
      <button 
        onClick={startCall} 
        disabled={!selectedUser}
      >
        Start Call
      </button>
    );
  }

  if (callStatus === 'calling') {
    return <button onClick={endCall}>Cancel Call</button>;
  }

  if (callStatus === 'inProgress') {
    return <button onClick={endCall}>End Call</button>;
  }

  if (incomingCall) {
    return (
      <>
        <button onClick={answerCall}>Answer</button>
        <button onClick={rejectCall}>Reject</button>
      </>
    );
  }

  return null;
};

// Video Streams Component
const VideoStreams: React.FC = () => {
  const localStream = useVideoCallStore(state => state.localStream);
  const remoteStream = useVideoCallStore(state => state.remoteStream);
  const callStatus = useVideoCallStore(state => state.callStatus);

  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  React.useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callStatus === 'idle') return null;

  return (
    <div className="video-streams">
      <video ref={localVideoRef} autoPlay muted playsInline className="local-video" />
      {remoteStream && (
        <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
      )}
    </div>
  );
};

// Incoming Call Notification Component
const IncomingCallNotification: React.FC = () => {
  const incomingCall = useVideoCallStore(state => state.incomingCall);

  if (!incomingCall) return null;

  return (
    <div className="incoming-call-notification">
      <p>Incoming call from {incomingCall.from.username}</p>
    </div>
  );
};
// SocketService.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { sessionStore } from '@/session/RedisSessionStore';
import { Logger } from '@/lib/logger';

const logger = new Logger(__filename);

class SocketService {
    private io: SocketIOServer;
    private socketToSession: Map<string, string> = new Map();
    private sessionToSocket: Map<string, string> = new Map();

    constructor(httpServer: HttpServer) {
        // ... (rest of the constructor remains the same)
    }

    private async handleAuth(socket: Socket): Promise<boolean> {
        // ... (existing auth logic)

        // If authentication is successful:
        const sessionId = socket.data.sessionId;
        const socketId = socket.id;

        this.socketToSession.set(socketId, sessionId);
        this.sessionToSocket.set(sessionId, socketId);

        // Update the session in Redis with the socket ID
        const session = await sessionStore.findSession(sessionId);
        if (session) {
            session.socketId = socketId;
            await sessionStore.saveSession(sessionId, session);
        }

        return true;
    }

    private handleDisconnect(socket: Socket) {
        const sessionId = this.socketToSession.get(socket.id);
        if (sessionId) {
            this.socketToSession.delete(socket.id);
            this.sessionToSession.delete(sessionId);
            // You might want to update the session in Redis here as well
        }
    }

    public emitMessage(
        receivers: string[],
        event: string,
        payload: object
    ) {
        receivers.forEach(async (sessionId) => {
            const socketId = this.sessionToSocket.get(sessionId);
            if (socketId) {
                this.io.to(socketId).emit(event, payload);
            } else {
                logger.warn(`No socket found for session ${sessionId}`);
                // Optionally, try to fetch from Redis as a fallback
                const session = await sessionStore.findSession(sessionId);
                if (session && session.socketId) {
                    this.io.to(session.socketId).emit(event, payload);
                } else {
                    logger.error(`Unable to emit to session ${sessionId}`);
                }
            }
        });
    }
}

// RedisSessionStore.ts
interface Session {
    userId: string;
    username: string;
    timestamp?: number;
    socketId?: string;  // Add this line
}

class RedisSessionStore {
    // ... (rest of the class remains the same)

    async saveSession(sessionId: string, session: Session): Promise<void> {
        session.timestamp = Date.now();
        const ttl = convertToMilliseconds('120m');
        this.logger.info(`Saving session with ID: ${sessionId} and TTL: ${ttl}`);
        await this.redisClient.set(
            `session:${sessionId}`,
            JSON.stringify(session),
            { EX: convertToMilliseconds('120m') }
        );
    }
}

// In your main server file or where you set up socket connections
io.on('connection', async (socket: Socket) => {
    const authResult = await socketService.handleAuth(socket);
    if (!authResult) {
        socket.disconnect();
        return;
    }

    // ... rest of your connection logic

    socket.on('disconnect', () => {
        socketService.handleDisconnect(socket);
    });
});


---
import { Socket, Server } from 'socket.io';
import { Logger } from '@/lib/logger';

const logger = new Logger(__filename);

// Type for connectedUsers map
type ConnectedUser = { userId: string; username: string; socketId: string };
type ConnectedUsersMap = Map<string, ConnectedUser>;

// Join user to a room based on their userId
export const joinUserRoom = (socket: Socket) => {
  const userId = socket.data.userId as string;
  if (userId) {
    socket.join(`user:${userId}`);
    logger.info(`User ${userId} joined room user:${userId}`);
  } else {
    logger.warn(`Unable to join user room: userId not found in socket.data`);
  }
};

// Utility function to get socketId based on userId
export const getSocketIdByUserId = (
  connectedUsers: ConnectedUsersMap,
  userId: string
): string | undefined => {
  for (const [, user] of connectedUsers) {
    if (user.userId === userId) {
      return user.socketId;
    }
  }
  return undefined;
};

// Updated handleUsers function
export const handleUsers = async (
  socket: Socket,
  connectedUsers: ConnectedUsersMap
) => {
  const userId = socket.data.userId as string;
  const username = socket.data.username as string;
  const sessionId = socket.data.sessionId as string;

  if (!userId || !username || !sessionId) {
    logger.error('User not authenticated, cannot manage connection.');
    return;
  }

  logger.info(`Managing connection for user ${username} (${userId})`);

  handleExistingConnection(connectedUsers, sessionId, socket.id);

  // Add/update the user in connectedUsers map
  connectedUsers.set(sessionId, {
    userId,
    username,
    socketId: socket.id
  });

  // Join user to their room
  joinUserRoom(socket);

  broadcastUserList(socket, connectedUsers);
};

// ... (handleExistingConnection and broadcastUserList remain the same)

// Updated emitMessage function
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
  },
  connectedUsers: ConnectedUsersMap
) => {
  receivers.forEach((receiverId) => {
    // Try to emit to the user's room first
    io.to(`user:${receiverId}`).emit(event, payload);

    // If that doesn't work (e.g., user not in room), try to find their socket ID
    const socketId = getSocketIdByUserId(connectedUsers, receiverId);
    if (socketId) {
      io.to(socketId).emit(event, payload);
    } else {
      logger.warn(`Unable to emit to user ${receiverId}: User not found`);
    }
  });
};

// Usage in your WebRTC signal handling function
private handleWebRTCSignal(socket: Socket, eventName: string, data: any): void {
  const sourceUserId = socket.data.userId as string;
  const { targetUserId, ...payload } = data;

  if (!sourceUserId || !targetUserId) {
    logger.error(`Invalid WebRTC signal data for event ${eventName}`);
    return;
  }

  emitMessage(
    this.io,
    {
      receivers: [targetUserId],
      event: eventName,
      payload: {
        ...payload,
        from: {
          userId: sourceUserId,
          username: socket.data.username
        }
      }
    },
    this.connectedUsers
  );

  logger.info(`WebRTC ${eventName} signal sent from ${sourceUserId} to ${targetUserId}`);
}