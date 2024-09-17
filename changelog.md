### Changelog: SocketService Enhancements

#### Version: `1.1.0`

---

#### New Features

1. **Emit to Specific Socket (`emitToSocket`)**
    - **Motivation**:  
      The need to send targeted messages or notifications to individual users (or clients) in a scalable and efficient manner, such as for private messages or user-specific notifications.
    - **Implementation**:  
      Introduced a new method `emitToSocket(socketId: string, eventName: string, message: any)` which allows broadcasting of events to a specific socket by socket ID.
    - **Example**:
      ```ts
      socketService.emitToSocket('abc123', 'private-message', { content: 'Hello, user!' });
      ```

2. **Broadcast to All Except Sender (`broadcast`)**
    - **Motivation**:  
      In cases like real-time messaging or notifications (e.g., a user joins a room), there is a frequent need to broadcast events to all connected clients, except the one that initiated the event (the sender). This method avoids sending duplicate or unnecessary data back to the initiator.
    - **Implementation**:  
      Added `broadcast(eventName: string, message: any, senderSocketId: string)` to handle broadcasting to all users except the originating sender, providing efficient real-time updates without duplicating the sender’s data.
    - **Example**:
      ```ts
      socketService.broadcast('user-joined', { username: 'John' }, 'abc123');
      ```

3. **Global or Room-Specific Emissions (`emit`)**
    - **Motivation**:  
      To refine the emission logic, allowing for easy broadcast of messages to either all users or users within a specific room, making it versatile for global announcements as well as targeted room-based notifications.
    - **Implementation**:  
      The `emit(eventName: string, message: any, roomId?: string)` method has been enhanced to handle both global and room-specific emissions. If a `roomId` is provided, the event is sent only to that room; otherwise, it is emitted globally.
    - **Example**:
      - Emitting to a specific room:
        ```ts
        socketService.emit('new-message', { content: 'Hello, Room!' }, 'room123');
        ```
      - Emitting globally:
        ```ts
        socketService.emit('announcement', { content: 'Global Announcement' });
        ```

---

#### Motivation

These changes were motivated by the need to support a variety of emission strategies for events in real-time applications, including:

- Private message handling (for 1-to-1 communications).
- Broadcasting updates to all clients while excluding the sender (to avoid redundant data).
- Ensuring flexibility in event broadcasting, whether globally or to specific rooms.

By extending the `SocketService` class, these features offer a more robust, modular, and scalable solution to managing real-time event emissions.

#### Examples of Usage

- **Private Messaging:**
  ```ts
  // Send a private message to a specific user (by their socket ID)
  socketService.emitToSocket('user-socket-123', 'private-message', { content: 'Hey, how are you?' });
  ```

- **Room Notifications:**
  ```ts
  // Notify all users in a room about a new message
  socketService.emit('new-message', { content: 'Welcome to the room!' }, 'room-xyz');
  ```

- **Broadcasting to All Except the Sender:**
  ```ts
  // Send an event to all users except the one who triggered it
  socketService.broadcast('user-joined', { username: 'Alice' }, 'socket-abc');
  ```

---

#### Summary

The addition of methods like `emitToSocket` and `broadcast` significantly improves the flexibility and performance of the socket service, making it well-suited for applications that require targeted event handling alongside global or room-specific broadcasts.