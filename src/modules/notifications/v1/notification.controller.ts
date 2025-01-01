import { cache } from '@/data/cache/cache.service';
import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { BadRequestError } from '@/lib/api';
import { SuccessResponse } from '@/lib/api/ApiResponse';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { User } from '@/modules/auth/users/user.model';
import { NotificationDocument, NotificationModel } from '../notification.model';

const logger = new Logger(__filename);
export const getUserNotifications = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const userId = user._id.toString();

	if (!userId) {
		return new BadRequestError('User ID is required');
	}
	logger.info('User ID', { userId });
	const key: string = getDynamicKey(DynamicKey.NOTIFICATIONS, userId);

	const notifications: NotificationDocument[] = await cache.getWithFallback<
		NotificationDocument[]
	>(key, async () => {
		return await NotificationModel.getNotificationsForUser(userId);
	});
	return new SuccessResponse('Notifications fetched', notifications).send(
		res
	);
});
