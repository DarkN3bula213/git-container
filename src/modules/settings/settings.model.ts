import { Document, Schema, Types, model } from 'mongoose';

type Visibility = 'all' | 'friends' | 'none';

export interface UserSettings extends Document {
	chatVisibility: Visibility;
	callVisibility: Visibility;
	profileVisibility: Visibility;
	lastLogin: Date;
	enableNotifications: boolean;
	userId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	friends: Types.ObjectId[];
	blockedUsers: Types.ObjectId[];
}

const UserSettingsSchema = new Schema<UserSettings>({
	chatVisibility: {
		type: String,
		enum: ['all', 'friends', 'none'],
		default: 'all'
	},
	callVisibility: {
		type: String,
		enum: ['all', 'friends', 'none'],
		default: 'all'
	},
	profileVisibility: {
		type: String,
		enum: ['all', 'friends', 'none'],
		default: 'all'
	},
	lastLogin: { type: Date, default: Date.now },
	enableNotifications: { type: Boolean, default: true },
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

	friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

const UserSettingsModel = model<UserSettings>(
	'UserSettings',
	UserSettingsSchema
);

export { UserSettingsModel };
