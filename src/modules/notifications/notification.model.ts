import mongoose from 'mongoose';

interface NotificationDocument extends mongoose.Document {
    title: string;
    message: string;
    time: Date;
    seenBy: string[];
}

interface NotificationModel extends mongoose.Model<NotificationDocument> {
    markAsRead(
        notificationId: string,
        userId: string
    ): Promise<NotificationDocument>;
    checkIfRead(notificationId: string, userId: string): Promise<boolean>;
}

const notificationSchema = new mongoose.Schema<NotificationDocument>(
    {
        title: { type: String, required: true },
        message: { type: String, required: true },
        time: { type: Date, default: Date.now },
        seenBy: { type: [String], default: [] }
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
    }
};

export const NotificationModel = mongoose.model<
    NotificationDocument,
    NotificationModel
>('Notification', notificationSchema, 'notifications');
