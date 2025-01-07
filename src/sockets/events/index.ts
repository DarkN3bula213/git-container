// export * from './handleDisconnect';
export * from './disconnect';
export * from './authentication';
export * from './messages';
export * from './users';
export enum DefaultSocketEvents {
	SYSTEM_MESSAGE = 'systemMessage',
	TO_ADMIN = 'toAdmin',
	USER_MESSAGE = 'userMessage',
	STATUS_UPDATE = 'statusUpdate'
}
