import { Server } from 'socket.io';
import { Logger } from '../../lib/logger';
import { emitMessage } from '../utils/emitMessage';

interface PendingOffer {
	fromUserId: string;
	signal: RTCSessionDescriptionInit;
	timestamp: number;
}

export class WebRTCSignalingService {
	private pendingOffers: Map<string, PendingOffer[]> = new Map();
	private readonly OFFER_TIMEOUT = 30000; // 30 seconds
	private logger: Logger;

	constructor(private io: Server) {
		this.logger = new Logger('WebRTCSignalingService');
		this.startOfferCleanup();
	}

	public addPendingOffer(
		toUserId: string,
		fromUserId: string,
		signal: RTCSessionDescriptionInit
	) {
		if (!this.pendingOffers.has(toUserId)) {
			this.pendingOffers.set(toUserId, []);
		}

		this.pendingOffers.get(toUserId)?.push({
			fromUserId,
			signal,
			timestamp: Date.now()
		});
	}

	public processPendingOffers(userId: string) {
		const offers = this.pendingOffers.get(userId) || [];
		this.pendingOffers.delete(userId);

		offers.forEach((offer) => {
			if (Date.now() - offer.timestamp <= this.OFFER_TIMEOUT) {
				emitMessage(this.io, {
					receivers: [userId],
					event: 'video-offer',
					payload: {
						fromUserId: offer.fromUserId,
						signal: offer.signal
					}
				});
			}
		});
	}

	public handleTrackUpdate(
		fromUserId: string,
		toUserId: string,
		kind: string,
		enabled: boolean
	) {
		emitMessage(this.io, {
			receivers: [toUserId],
			event: 'track-state-changed',
			payload: { fromUserId, kind, enabled }
		});
	}

	private startOfferCleanup() {
		setInterval(() => {
			const now = Date.now();
			this.pendingOffers.forEach((offers, userId) => {
				const validOffers = offers.filter(
					(offer) => now - offer.timestamp <= this.OFFER_TIMEOUT
				);

				if (validOffers.length === 0) {
					this.pendingOffers.delete(userId);
				} else if (validOffers.length !== offers.length) {
					this.pendingOffers.set(userId, validOffers);
				}
			});
		}, this.OFFER_TIMEOUT);
	}
}
