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
  const sessions = await UserSessionModel.aggregate([
    {
      $addFields: {
        convertedUserID: { $toObjectId: '$userID' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'convertedUserID',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    {
      $unwind: '$userDetails',
    },
    {
      $project: {
        _id: 1,
        userID: 1,
        timeSpent: 1,
        startTime: 1,
        endTime: 1,
        userName: '$userDetails.name',
      },
    },
  ]);

  res.status(200).json(sessions);
});

/*<!----------(3  Behaviors) ------------------------(DELETE) */

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

/*<!---------( 1 Behaviour ) -------------------------(POST) */

export const saveSession = asyncHandler(async (req, res) => {
  const { userID, startTime, endTime, timeSpent } = req.body;
  const session = new UserSessionModel({
    userID,
    startTime,
    endTime,
    timeSpent,
  });
  await session.save();

  res.status(200).json(session);
});
