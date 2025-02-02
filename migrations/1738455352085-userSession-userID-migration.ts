// Import your models here
import mongoose from 'mongoose';
import { Logger } from '../src/lib/logger';
import UserSessionModel from '../src/modules/auth/sessions/session.model';

const logger = new Logger('userSession-userID-migration');

export async function up(): Promise<void> {
	try {
		logger.debug('Starting migration script...');

		const hasUserID = await UserSessionModel.exists({
			userID: { $exists: true }
		});

		if (!hasUserID) {
			logger.debug(
				'No documents contain `userID`, migration is not needed.'
			);
			return;
		}

		logger.debug('Documents found with `userID`, starting migration...');

		// Find all documents with `userID` field and update them
		const result = (await UserSessionModel.updateMany(
			{ userID: { $exists: true } },
			[
				{
					$set: { userId: '$userID' }
				},
				{
					$unset: 'userID'
				}
			],
			{ writeConcern: { w: 'majority', wtimeout: 5000 } }
		)) as mongoose.UpdateWriteOpResult;

		logger.debug(
			`Migration complete. Modified ${result.matchedCount} documents.`
		);
	} catch (error) {
		logger.error({
			event: 'Error migrating userID to userId',
			error: JSON.stringify(error, null, 2)
		});
	}
	// Write migration here
}

export async function down(): Promise<void> {
	// The reverse of the up function
	try {
		const result = await UserSessionModel.updateMany(
			{ userId: { $exists: true } },
			{ $set: { userID: '$userId' } }
		);

		logger.debug(
			`Migration complete. Modified ${result.matchedCount} documents.`
		);
	} catch (error) {
		logger.error({
			event: 'Error migrating userId to userID',
			error: JSON.stringify(error, null, 2)
		});
	}
}
