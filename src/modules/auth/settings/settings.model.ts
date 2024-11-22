import mongoose, { Model, Schema, Types } from 'mongoose';

interface BaseSettings {
	updatedAt: Date;
	userId: mongoose.Types.ObjectId;
}

interface NotificationSettings {
	showNotifications: boolean;
	showSystemMessages: boolean;
	showUserMessages: boolean;
}

interface AppSettings {
	showBanner: boolean;
}

interface PrivacySettings {
	showProfile: boolean;
	showReadReceipts: boolean;
	privatePosts: boolean;
	showStatus: boolean;
}

export interface Settings extends BaseSettings {
	updateSetting(path: string, value: unknown): unknown;
	notificationSettings: NotificationSettings;
	appSettings: AppSettings;
	privacySettings: PrivacySettings;
}

interface UserSettingsModel extends Settings, Document {
	findByIdAndDelete(userId: string | Types.ObjectId, arg1: unknown): unknown;
	updateSetting<K extends keyof Settings>(
		path: K,
		value: Settings[K]
	): Promise<void>;
	findOrCreateSettings(userId: mongoose.Types.ObjectId): Promise<Settings>;
}

const schema = new mongoose.Schema<Settings>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			unique: true
		},
		notificationSettings: {
			showNotifications: {
				type: Boolean,
				default: false
			},
			showSystemMessages: {
				type: Boolean,
				default: false
			},
			showUserMessages: {
				type: Boolean,
				default: false
			}
		},
		appSettings: {
			showBanner: {
				type: Boolean,
				default: false
			}
		},
		privacySettings: {
			showProfile: {
				type: Boolean,
				default: false
			}
		},
		updatedAt: { type: Date, default: Date.now }
	},
	{
		statics: {
			findOrCreateSettings: async function (
				userId: mongoose.Types.ObjectId
			): Promise<Settings> {
				let settings = await this.findOne({ userId });
				if (!settings) {
					settings = await this.create({ userId });
				}
				return settings;
			}
		},
		methods: {
			updateSetting: async function <K extends keyof Settings>(
				this: mongoose.Document & Settings,
				path: K,
				value: Settings[K]
			): Promise<void> {
				this.set(path, value);
				this.updatedAt = new Date();
				await this.save();
			}
		}
	}
);

schema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

const UserSettings = mongoose.model<Settings, UserSettingsModel>(
	'UserSettings',
	schema
);

export default UserSettings;
