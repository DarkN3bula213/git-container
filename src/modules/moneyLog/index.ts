import { ProductionLogger } from '@/lib/logger/v1/logger';
import mongoose from 'mongoose';

const logger = new ProductionLogger(__filename);

const schema = new mongoose.Schema({
	date: { type: Date, required: true, default: Date.now, unique: true },
	total: { type: Number, required: true }
});

type MoneyFlowModel = mongoose.InferSchemaType<typeof schema>;
export const MoneyFlow = mongoose.model<MoneyFlowModel>('MoneyFlow', schema);

// Function to save the money flow to MongoDB
export async function saveMoneyFlowToMongo(totalAmount: number): Promise<void> {
	try {
		const flowData = new MoneyFlow({
			total: totalAmount
		});

		await flowData.save();
		logger.info({
			message: 'Money flow for the day saved to MongoDB',
			total: totalAmount
		});
	} catch (err) {
		logger.error({
			message: 'Error saving money flow to MongoDB:',
			error: err
		});
		throw err;
	}
}
