import mongoose from 'mongoose';

export interface NotificationDocument extends mongoose.Document {
	title: string;
	message: string;
	time: Date;
	seenBy: string[];
	isDeleted: string[];
}

interface NotificationModel extends mongoose.Model<NotificationDocument> {
	markAsRead(
		notificationId: string,
		userId: string
	): Promise<NotificationDocument>;
	checkIfRead(notificationId: string, userId: string): Promise<boolean>;
	markAsDeleted(
		notificationId: string,
		userId: string
	): Promise<NotificationDocument>;
	getNotificationsForUser(
		userId: string
	): Promise<Array<NotificationDocument & { seen: boolean }>>;
}

const notificationSchema = new mongoose.Schema<NotificationDocument>(
	{
		title: { type: String, required: true },
		message: { type: String, required: true },
		time: { type: Date, default: Date.now },
		seenBy: { type: [String], default: [] },
		isDeleted: { type: [String], default: [] }
	},
	{ versionKey: false, timestamps: true }
);

// Static methods
notificationSchema.statics = {
	async markAsRead(notificationId: string, userId: string) {
		const notification = await this.findById(notificationId);
		if (!notification) throw new Error('Notification not found');

		if (!notification.seenBy.includes(userId)) {
			notification.seenBy.push(userId);
			await notification.save();
		}
		return notification;
	},

	async checkIfRead(notificationId: string, userId: string) {
		const notification = await this.findById(notificationId);
		if (!notification) throw new Error('Notification not found');

		return notification.seenBy.includes(userId);
	},
	async markAsDeleted(notificationId: string, userId: string) {
		const notification = await this.findById(notificationId);
		if (!notification) throw new Error('Notification not found');

		if (!notification.isDeleted.includes(userId)) {
			notification.isDeleted.push(userId);

			await notification.save();
		}
		if (notification.seenBy.includes(userId)) {
			notification.seenBy = notification.seenBy.filter(
				(id: string) => id !== userId
			);
			await notification.save();
		}
		return notification;
	}
};

// Add this static method to your schema
notificationSchema.statics.getNotificationsForUser = async function (
	userId: string
) {
	return this.aggregate([
		{
			$match: {
				isDeleted: { $nin: [userId] }
			}
		},
		{
			$addFields: {
				seen: {
					$in: [userId, { $ifNull: ['$seenBy', []] }]
				}
			}
		},
		{
			$project: {
				title: 1,
				message: 1,
				seenBy: 1,
				isDeleted: 1,
				createdAt: 1,
				updatedAt: 1,
				seen: 1,
				time: 1
			}
		}
	]);
};
export const NotificationModel = mongoose.model<
	NotificationDocument,
	NotificationModel
>('Notification', notificationSchema, 'notifications');
