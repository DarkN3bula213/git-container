import { Logger } from '@/lib/logger';
import mongoose, { Types, type ClientSession } from 'mongoose';

type TransactionCallback<T> = (session: ClientSession) => Promise<T>;
const logger = new Logger(__filename);

export async function withTransaction<T>(
	callback: TransactionCallback<T>
): Promise<T> {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const result = await callback(session);
		logger.info('Transaction Success');

		await session.commitTransaction();
		return result;
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
	}
}
export const  convertToObjectId = (id: string): Types.ObjectId => {
		return new Types.ObjectId(id);
	};