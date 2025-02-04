import { SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { UserSettings, UserSettingsModel } from './settings.model';

export const getUserSettings = asyncHandler(async (req, res) => {
	const { userId } = req.params;
	const settings = (await UserSettingsModel.findOne({
		userId
	})) as UserSettings;
	return new SuccessResponse(
		'User settings fetched successfully',
		settings
	).send(res);
});

export const updateUserSettings = asyncHandler(async (req, res) => {
	const { userId } = req.params;
	const {
		chatVisibility,
		callVisibility,
		profileVisibility,
		enableNotifications
	} = req.body;
	const settings = (await UserSettingsModel.findOneAndUpdate(
		{ userId },
		{
			chatVisibility,
			callVisibility,
			profileVisibility,
			enableNotifications
		},
		{ new: true }
	)) as UserSettings;
	return new SuccessResponse(
		'User settings updated successfully',
		settings
	).send(res);
});

export const addFriend = asyncHandler(async (req, res) => {
	const { userId } = req.params;
	const { friendId } = req.body;
	const settings = await UserSettingsModel.findOneAndUpdate(
		{ userId },
		{ $push: { friends: friendId } },
		{ new: true }
	);
	return new SuccessResponse('Friend added successfully', settings).send(res);
});

export const removeFriend = asyncHandler(async (req, res) => {
	const { userId } = req.params;
	const { friendId } = req.body;
	const settings = await UserSettingsModel.findOneAndUpdate(
		{ userId },
		{ $pull: { friends: friendId } },
		{ new: true }
	);
	return new SuccessResponse('Friend removed successfully', settings).send(
		res
	);
});
