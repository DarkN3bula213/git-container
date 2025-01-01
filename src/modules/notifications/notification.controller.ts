import { BadRequestError, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { User } from '../auth/users/user.model';
import { NotificationModel } from './notification.model';

export const getNotifications = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const userId = user._id?.toString();
	// Get notifications with that are not deleted by the user
	if (!userId) {
		return new BadRequestError('User ID is required');
	}
	const notifications = await NotificationModel.find({
		isDeleted: { $nin: [userId] }
	}).lean();
	const notificationsWithSeen = notifications.map((notification) => ({
		...notification,
		seen: notification.seenBy.includes(userId.toString())
	}));
	res.status(200).json(notificationsWithSeen);
});

export const createNotification = asyncHandler(async (req, res) => {
	const { title, message } = req.body;
	const notification = await NotificationModel.create({ title, message });
	res.status(201).json({
		success: true,
		data: notification
	});
});

export const markAsRead = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const userId = user._id?.toString();
	if (!userId) {
		return new BadRequestError('User ID is required');
	}
	const notificationId = req.params.id;
	const notification = await NotificationModel.markAsRead(
		notificationId,
		userId
	);
	res.status(200).json({
		success: true,
		data: notification
	});
});

export const checkIfRead = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const userId = user._id?.toString();
	if (!userId) {
		return new BadRequestError('User ID is required');
	}
	const notificationId = req.params.id;
	const isRead = await NotificationModel.checkIfRead(notificationId, userId);
	res.status(200).json({
		success: true,
		data: isRead
	});
});

export const deleteNotification = asyncHandler(async (req, res) => {
	const notificationId = req.params.id;
	const notification =
		await NotificationModel.findByIdAndDelete(notificationId);
	res.status(200).json({
		success: true,
		data: notification
	});
});

export const deleteAllNotifications = asyncHandler(async (_req, res) => {
	const notifications = await NotificationModel.deleteMany({});
	res.status(200).json({
		success: true,
		data: notifications
	});
});

export const getNotificationById = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const user = req.user as User;
	const userId = user._id?.toString();
	if (!userId) {
		return new BadRequestError('User ID is required');
	}

	const notification = await NotificationModel.findByIdAndUpdate(
		id,
		{ $addToSet: { seenBy: userId.toString() } },
		{ new: true, lean: true }
	);

	if (!notification) {
		return res.status(404).json({ message: 'Notification not found' });
	}

	// Since we've already added userId to seenBy, we know 'seen' is true
	res.status(200).json({ ...notification, seen: true });
});

export const getUnseenNotifications = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const userId = user._id;
	const notifications = await NotificationModel.find({
		seenBy: { $nin: [userId] }
	}).lean();
	res.status(200).json(notifications);
});

export const getSeenNotifications = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const userId = user._id;
	const notifications = await NotificationModel.find({
		seenBy: userId
	}).lean();
	res.status(200).json(notifications);
});

export const getNotificationCount = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const userId = user._id;
	const count = await NotificationModel.countDocuments({
		seenBy: { $nin: [userId] }
	});
	res.status(200).json({ count });
});

export const getSeenNotificationCount = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const userId = user._id;
	const count = await NotificationModel.countDocuments({
		seenBy: userId
	});
	res.status(200).json({ count });
});

export const markAsDeleted = asyncHandler(async (req, res) => {
	const user = req.user as User;
	const userId = user._id?.toString();
	if (!userId) {
		return new BadRequestError('User ID is required');
	}
	const notificationId = req.params.id;
	const notification = (await NotificationModel.markAsDeleted(
		notificationId,
		userId
	)) as any;
	return new SuccessResponse(
		'Notification marked as deleted',
		notification
	).send(res);
});
