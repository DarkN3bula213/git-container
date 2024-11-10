import { Logger } from '@/lib/logger';
import { type Document, InferSchemaType, Schema, Types, model } from 'mongoose';

const logger = new Logger('Session Model');

export interface UserSession extends Document {
	userID: string;
	startTime: Date;
	endTime: Date;
	timeSpent: string;
	lastLoggedIn?: Date;
	userAgent: string;
	ipAddress: string;
	paymentActivities: PaymentActivity[];
	totalTransactions: number;
	totalAmount: number;
}

// Interface for payment activity within a session
interface PaymentActivity {
	paymentId: Types.ObjectId;
	action: 'created' | 'deleted';
	amount: number;
	studentId: Types.ObjectId;
	studentName: string;
	timestamp: Date;
	payId?: string;
	invoiceId?: string;
}
const PaymentActivitySchema = new Schema<PaymentActivity>({
	paymentId: { type: Schema.Types.ObjectId, required: true },
	action: { type: String, enum: ['created', 'deleted'], required: true },
	amount: { type: Number, required: true },
	studentId: { type: Schema.Types.ObjectId, required: true },
	studentName: { type: String, required: true },
	timestamp: { type: Date, default: Date.now },
	payId: { type: String },
	invoiceId: { type: String }
});

const UserSessionSchema: Schema = new Schema<UserSession>(
	{
		userID: { type: String, required: true },
		startTime: { type: Date, required: true },
		endTime: { type: Date, required: true },
		timeSpent: { type: String, required: true },
		lastLoggedIn: { type: Date, default: Date.now },
		paymentActivities: [PaymentActivitySchema],
		totalTransactions: { type: Number, default: 0 },
		totalAmount: { type: Number, default: 0 }
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

type UserSessionModelType = InferSchemaType<typeof UserSessionSchema>;
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

// Function to record payment activity
export const recordPaymentActivity = async (
	sessionId: string,
	activity: Omit<PaymentActivity, 'timestamp'>
) => {
	try {
		const session = await UserSessionModel.findById(sessionId);
		if (!session) throw new Error('Session not found');

		(session.paymentActivities as PaymentActivity[]).push({
			...activity,
			timestamp: new Date()
		});

		// Update totals
		session.totalTransactions = (session.totalTransactions as number) + 1;
		session.totalAmount =
			(session.totalAmount as number) +
			(activity.action === 'created'
				? activity.amount
				: -activity.amount);

		return await session.save();
	} catch (error: any) {
		logger.error(`Error recording payment activity: ${error.message}`);
		throw error;
	}
};
