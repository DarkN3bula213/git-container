import { Logger } from '@/lib/logger';
import { RequestTrackerService } from '@/services/request-tracker';
import { type Document, InferSchemaType, Schema, model } from 'mongoose';

const logger = new Logger('Session Model');

export interface ActivitySummary {
	total: number;
	byMethod: Map<string, number>;
	byStatus: Map<string, number>;
	resourceAccess: {
		path: string;
		count: number;
		methods: Map<string, number>;
		lastAccessed: Date;
	}[];
}

export interface UserSession extends Document {
	userID: string;
	startTime: Date;
	endTime: Date;
	timeSpent: string;
	lastLoggedIn?: Date;
	userAgent: string;
	ipAddress: string;

	totalTransactions: number;
	totalAmount: number;
	activity: ActivitySummary;
}

const ActivitySummarySchema = new Schema<ActivitySummary>(
	{
		total: { type: Number, default: 0 },
		byMethod: { type: Map, of: Number, default: {} },
		byStatus: { type: Map, of: Number, default: {} },
		resourceAccess: [
			{
				path: { type: String, required: true },
				count: { type: Number, default: 0 },
				methods: { type: Map, of: Number, default: {} },
				lastAccessed: { type: Date, default: Date.now }
			}
		]
	},
	{ _id: false }
);

const UserSessionSchema: Schema = new Schema<UserSession>(
	{
		userID: { type: String, required: true },
		startTime: { type: Date, required: true },
		endTime: { type: Date, required: true },
		timeSpent: { type: String, required: true },
		lastLoggedIn: { type: Date, default: Date.now },

		activity: { type: ActivitySummarySchema }
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

interface UserSessionMethods {
	updateActivity: (requestTracker: RequestTrackerService) => Promise<void>;
}

type UserSessionModelType = InferSchemaType<typeof UserSessionSchema> &
	UserSessionMethods;
const UserSessionModel = model<UserSessionModelType>(
	'UserSession',
	UserSessionSchema
);

export default UserSessionModel;

export const createUserSession = async (
	userID: string,
	startTime: Date,
	endTime: Date,
	timeSpent: string
) => {
	try {
		// Assume session creation involves database operations
		const session = new UserSessionModel({
			userID,
			startTime,
			endTime,
			timeSpent
		});
		await session.save();
	} catch (error: any) {
		logger.error(
			`Error saving session for user ${userID}: ${error.message}`
		);
		throw error; // Important to rethrow the error to ensure Bull understands the job failed
	}
};

// Add methods to help with activity updates
UserSessionSchema.methods.updateActivity = async function (
	requestTracker: RequestTrackerService
) {
	const today = new Date().toISOString().split('T')[0];
	const userActivity = await requestTracker.getUserActivity(
		this.userID,
		today
	);

	if (!userActivity) return;

	this.activity = {
		total: userActivity.total,
		byMethod: userActivity.byMethod,
		byStatus: userActivity.byStatus,
		resourceAccess: Object.entries(userActivity.byPath)
			.map(([path, data]) => ({
				path,
				count: data.count,
				methods: data.methods,
				lastAccessed: userActivity.lastAccessed
			}))
			.sort((a, b) => b.count - a.count)
	};

	return this.save();
};
