import { BadRequestError } from '@/lib/api/ApiError';
import { SuccessResponse } from '@/lib/api/ApiResponse';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { User } from '../users/user.model';
import settingsService from './settings.service';

export const updateSetting = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const userId = user._id;
	if (!userId) {
		return new BadRequestError('User ID is required');
	}
	const settings = await settingsService.updateSetting(
		userId,
		req.body // Pass the entire settings object directly
	);

	return new SuccessResponse('Setting updated successfully', settings).send(
		res
	);
});
