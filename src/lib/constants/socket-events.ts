const socketEvents = {
  // Auth
  OPT_IN_CHAT: 'opt-in-chat',
  OPT_OUT_CHAT: 'opt-out-chat',
  // Chat
  send_message: 'send-message',
  start_sharing: 'start_sharing',
  stop_sharing: 'stop_sharing',
  get_messages: 'get-messages',
  add_message: 'add-message',
  // Rooms
  room_created: 'room-created',
  join_room: 'join-room',
  create_room: 'create-room',
  leave_room: 'leave-room',
  room_status: 'room-status',

  // Users
  users_joined: 'users-joined',
  get_users: 'get-users',
  user_disconnected: 'user-disconnected',
  name_changed: 'name-changed',
  change_name: 'change-name',
} as const;

export default socketEvents;
