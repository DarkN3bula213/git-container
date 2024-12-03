import { BadRequestError } from '@/lib/api/ApiError';
import { SuccessResponse } from '@/lib/api/ApiResponse';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { User } from '../users/user.model';
import settingsService from './settings.service';

export const updateSetting = asyncHandler(async (req, res) => {
	const user = req.user as User;
	if (!user) {
		return new BadRequestError('User not found');
	}
	const settings = await settingsService.updateSetting(
		user._id,
		req.body // Pass the entire settings object directly
	);

	return new SuccessResponse('Setting updated successfully', settings).send(
		res
	);
});
