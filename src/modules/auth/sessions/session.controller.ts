import asyncHandler from '@/lib/handlers/asyncHandler';

import UserSessionModel from './session.model';

/*<!----------(3 Behaviors)------------------------(GET) */

export const getSessions = asyncHandler(async (_req, res) => {
	const sessions = await UserSessionModel.find();
	res.status(200).json(sessions);
});

export const getSessionById = asyncHandler(async (req, res) => {
	const sessionId = req.params.id;
	const session = await UserSessionModel.findById(sessionId);
	res.status(200).json(session);
});

export const getSessionsByUserId = asyncHandler(async (req, res) => {
	const userId = req.params.id;
	const sessions = await UserSessionModel.find({ userId });
	res.status(200).json(sessions);
});

export const getAggregateSessions = asyncHandler(async (_req, res) => {
	const sessions = (await UserSessionModel.aggregate([
		{
			$addFields: {
				convertedUserID: { $toObjectId: '$userID' }
			}
		},
		{
			$lookup: {
				from: 'users',
				localField: 'convertedUserID',
				foreignField: '_id',
				as: 'userDetails'
			}
		},
		{
			$unwind: '$userDetails'
		},
		{
			$project: {
				_id: 1,
				userID: 1,
				timeSpent: 1,
				startTime: 1,
				endTime: 1,
				userName: '$userDetails.name',
				lastLogin: '$userDetails.lastLogin'
			}
		}
	])) as {}[];

	res.status(200).json(sessions);
});

/*<!----------( 4  Behaviors ) ------------------------(DELETE) */

export const deleteSession = asyncHandler(async (req, res) => {
	const sessionId = req.params.id;
	const session = await UserSessionModel.findByIdAndDelete(sessionId);
	res.status(200).json(session);
});

export const deleteAllSessions = asyncHandler(async (_req, res) => {
	const sessions = await UserSessionModel.deleteMany();
	res.status(200).json(sessions);
});

export const deleteSessionsByUserId = asyncHandler(async (req, res) => {
	const userId = req.params.id;
	const sessions = await UserSessionModel.deleteMany({ userId });
	res.status(200).json(sessions);
});

export const deleteMany = asyncHandler(async (req, res) => {
	const { ids } = req.body; // Expecting { ids: ['id1', 'id2', 'id3'] }

	// Check if `ids` is an array
	if (!Array.isArray(ids)) {
		return res
			.status(400)
			.json({ error: 'Invalid input, expected an array of IDs' });
	}

	// Delete the sessions matching the provided IDs
	const sessions = await UserSessionModel.deleteMany({ _id: { $in: ids } });

	res.status(200).json(sessions);
});
