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

