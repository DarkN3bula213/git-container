export interface ConnectedUser {
	userId: string;
	username: string;
	socketId: string;
	isAdmin?: boolean;
	isAvailable?: boolean;
}
