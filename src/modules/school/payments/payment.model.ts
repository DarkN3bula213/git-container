import { cache } from '@/data/cache/cache.service';
import { Logger } from '@/lib/logger';
import mongoose, { Schema } from 'mongoose';

const logger = new Logger(__filename);

export interface IPayment extends mongoose.Document {
	studentId: mongoose.Schema.Types.ObjectId;
	classId: mongoose.Schema.Types.ObjectId;
	studentName: string;
	className: string;
	section: string;
	amount: number;
	paymentDate: Date;
	paymentMethod: string;
	paymentStatus: string;
	payId: string;
	paymentType: string;
	description: string;
	createdBy: mongoose.Schema.Types.ObjectId;
	updatedBy: mongoose.Schema.Types.ObjectId;
	invoiceId: string;
	version: number;
	createdAt: Date;
	updatedAt: Date;
}

const schema: Schema<IPayment> = new Schema<IPayment>(
	{
		invoiceId: { type: String, required: false, unique: true },
		studentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Student',
			required: true
		},
		studentName: {
			type: String
		},
		classId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Class',
			required: true
		},
		className: { type: String, required: true },
		section: { type: String, required: true },
		amount: { type: Number, required: true },
		paymentDate: { type: Date, required: true },
		paymentMethod: {
			type: String,
			default: 'cash'
		},
		paymentStatus: {
			type: String,
			default: 'success'
		},
		payId: { type: String, required: true },
		paymentType: {
			type: String,
			default: 'full'
		},
		description: { type: String },
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		version: { type: Number, default: 1 }
	},
	{
		timestamps: true,
		versionKey: 'version'
	}
);

// Save the money flow in Redis
async function updateMoneyFlow(
	doc: { className: string; section: string; amount: number },
	next: () => void
) {
	const { className, section, amount } = doc;

	try {
		// Use a key for each class-section combination
		const redisKey = `classSection:${className}:${section}`;

		// Increment the total amount for this class-section
		const result = await cache
			.getClient()
			.hIncrBy(redisKey, 'totalAmount', amount);

		logger.info({
			message: `Updated Redis for ${className}-${section}: New total amount is ${result}`,
			className: className,
			section: section,
			amount: amount
		});
	} catch (err) {
		logger.error({
			message: 'Error updating class-section money flow in Redis:',
			error: err
		});
	}

	next();
}

schema.post('save', updateMoneyFlow);

export async function deleteMoneyFlow(
	doc: { className: string; section: string; amount: number },
	next: () => void
) {
	const { className, section, amount } = doc;

	try {
		// Use the class-section combination key
		const redisKey = `classSection:${className}:${section}`;

		// Decrease the total amount for this class-section
		const result = await cache
			.getClient()
			.hIncrBy(redisKey, 'totalAmount', -amount);

		logger.info({
			message: `Updated Redis for ${className}-${section}: New total amount is ${result}`,
			className: className,
			section: section,
			amount: amount
		});
	} catch (err) {
		logger.error({
			message: 'Error updating class-section money flow in Redis:',
			error: err
		});
	}

	next();
}

schema.index({ studentId: 1, payId: 1 }, { unique: true });
schema.index({ studentId: 1, paymentDate: 1 });
schema.index({ payId: 1, studentId: 1 });

const paymentModel = mongoose.model<IPayment>('Payment', schema);

export default paymentModel;
