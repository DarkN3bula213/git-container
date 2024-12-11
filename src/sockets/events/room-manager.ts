export interface Room {
	id: string;
	participants: Set<string>;
}

export interface SignalData {
	type: 'offer' | 'answer' | 'candidate';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload: any;
	from: string;
	to: string;
	room: string;
}

export class RoomManager {
	private rooms: Map<string, Room>;

	constructor() {
		this.rooms = new Map();
	}

	createRoom(roomId: string): Room {
		const room: Room = {
			id: roomId,
			participants: new Set()
		};
		this.rooms.set(roomId, room);
		return room;
	}

	joinRoom(roomId: string, participantId: string): Room {
		let room = this.rooms.get(roomId);
		if (!room) {
			room = this.createRoom(roomId);
		}
		room.participants.add(participantId);
		return room;
	}

	leaveRoom(roomId: string, participantId: string): void {
		const room = this.rooms.get(roomId);
		if (room) {
			room.participants.delete(participantId);
			if (room.participants.size === 0) {
				this.rooms.delete(roomId);
			}
		}
	}

	getRoom(roomId: string): Room | undefined {
		return this.rooms.get(roomId);
	}

	getRoomParticipants(roomId: string): string[] {
		const room = this.rooms.get(roomId);
		return room ? Array.from(room.participants) : [];
	}
}
