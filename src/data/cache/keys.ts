export enum Key {
	roles = 'roles',
	Events = 'Events',
	DAILYTOTAL = 'DailyAmount'
}
export enum DynamicKey {
	CLASS = 'class',
	FEE = 'fee',
	STUDENTS = 'students',
	CONVERSATION = 'conversation',
	USER = 'USER',
	CLASS_SUBJECTS = 'class_subjects',
	NOTIFICATIONS = 'NOTIFICATIONS',
	SESSION = 'session',
	RESULT = 'result'
}

export type DynamicKeyType = `${DynamicKey}:${string}`;

export function getDynamicKey(key: DynamicKey, suffix: string) {
	const dynamic: DynamicKeyType = `${key}:${suffix}`;
	return dynamic;
}

export const usersKey = (userId: string) => `users#${userId}`;
export const roleKey = (userId: string) => `role#${userId}`;
export const startTimeKey = (userId: string) => `startTime#${userId}`;
export const sessionJobKey = (userId: string) => `session-job-${userId}`;
