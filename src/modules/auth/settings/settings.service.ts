import { withTransaction } from '@/data/database/db.utils';
import { Logger } from '@/lib/logger';
import settings, { Settings } from '@/modules/auth/settings/settings.model';
import { Types } from 'mongoose';

const logger = new Logger('UserSettingsService');

export class UserSettingsService {
	private static instance: UserSettingsService;
	private constructor() {}

	static getInstance(): UserSettingsService {
		if (!UserSettingsService.instance) {
			UserSettingsService.instance = new UserSettingsService();
		}
		return UserSettingsService.instance;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async getSettings(userId: Types.ObjectId): Promise<any> {
		try {
			const userSettings = await settings.findOne({ userId });
			// logger.info({
			// 	message: 'userSettings',
			// 	userSettings: JSON.stringify(userSettings)
			// });
			if (!userSettings) {
				return await settings.create({
					userId: userId
				});
			}
			return userSettings;
		} catch (error) {
			logger.error('Error fetching user settings:', error);
			throw new Error(error as string);
		}
	}

	// ... existing code ...

	async updateSetting(
		userId: Types.ObjectId,
		data: Partial<Settings>
	): Promise<Settings> {
		try {
			const userSettings = await this.getSettings(userId);

			// Handle each possible settings category
			if (data.appSettings) {
				Object.entries(data.appSettings).forEach(([key, value]) => {
					userSettings.appSettings[
						key as keyof typeof userSettings.appSettings
					] = value;
				});
			}

			if (data.notificationSettings) {
				Object.entries(data.notificationSettings).forEach(
					([key, value]) => {
						userSettings.notificationSettings[
							key as keyof typeof userSettings.notificationSettings
						] = value;
					}
				);
			}

			await userSettings.save();
			return userSettings;
		} catch (error) {
			logger.error('Error updating user setting:', error);
			throw new Error('Failed to update user setting');
		}
	}

	// ... existing code ...

	async resetSettings(userId: string | Types.ObjectId) {
		return withTransaction(async (session) => {
			await settings.findByIdAndDelete(userId, { session });
		});
	}
}

const userSettingsService = UserSettingsService.getInstance();

export default userSettingsService;
