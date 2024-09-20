import { Logger } from '@/lib/logger';

import mongoose from 'mongoose';

const logger = new Logger(__filename);
const sessionSchema = new mongoose.Schema(
	{
		userId: { type: String }
		// other fields in the session document
	},
	{ strict: false }
);

const Session = mongoose.model('Session', sessionSchema);

export async function migrateUserIDToUserId() {
	try {
		logger.debug('Starting migration script...');

		const hasUserID = await Session.exists({ userID: { $exists: true } });

		if (!hasUserID) {
			logger.debug(
				'No documents contain `userID`, migration is not needed.'
			);
			return;
		}

		logger.debug('Documents found with `userID`, starting migration...');

		// Find all documents with `userID` field and update them
		const result = (await Session.updateMany(
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
		logger.error('Migration failed:', error);
	}
}
