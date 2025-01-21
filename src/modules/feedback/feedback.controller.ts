import { SuccessResponse } from '@/lib/api';
import { BadRequestError } from '@/lib/api/ApiError';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { User } from '@/modules/auth/users/user.model';
import Feedback, { IFeedback } from './feedback.model';

export const postFeedback = asyncHandler(async (req, res) => {
	const { message, attachment } = req.body;
	const file = req.file;

	if (attachment) {
		if (!file) {
			throw new BadRequestError('No file uploaded');
		}
	}
	const user = req.user as User;

	const feedback = (await Feedback.create({
		userId: user._id,
		message,
		attachment: file?.path
	})) as unknown as IFeedback;

	return new SuccessResponse(
		'Feedback submitted successfully',
		feedback
	).send(res);
});

export const getFeedback = asyncHandler(async (req, res) => {
	const feedback = (await Feedback.find()) as unknown as IFeedback[];

	return new SuccessResponse('Feedback fetched successfully', feedback).send(
		res
	);
});
