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
	async getSettings(userId: Types.ObjectId): Promise<any> {
		try {
			const userSettings = await settings.findOne({ userId });
			logger.info({
				message: 'userSettings',
				userSettings: JSON.stringify(userSettings)
			});
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

	async updateSetting(
		userId: Types.ObjectId,
		path: string,
		value: unknown
	): Promise<Settings> {
		try {
			const settings = await this.getSettings(userId);
			await settings.updateSetting(path, value);
			return settings;
		} catch (error) {
			logger.error('Error updating user setting:', error);
			throw new Error('Failed to update user setting');
		}
	}

	async resetSettings(userId: string | Types.ObjectId) {
		return withTransaction(async (session) => {
			await settings.findByIdAndDelete(userId, { session });
		});
	}
}

const userSettingsService = UserSettingsService.getInstance();

export default userSettingsService;
