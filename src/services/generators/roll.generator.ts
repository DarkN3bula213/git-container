import { Logger } from '@/lib/logger';
import { IIDTracker } from '@/modules/school/students/ID Tracker/idTracker.model';
import { IDTrackerModel } from '@/modules/school/students/ID Tracker/idTracker.model';
import StudentModel from '@/modules/school/students/student.model';
import dayjs from 'dayjs';
import mongoose from 'mongoose';

const logger = new Logger('RollGenerator');
/**
 * Generates a unique student ID with format YYMMDD-C-SS
 * Where:
 * - YYMMDD is the current date
 * - C is a check digit (0-9)
 * - SS is a sequence number (00-99)
 *
 * @param session Optional mongoose session for transaction support
 * @returns A unique student ID
 */
export const generateUniqueRollNumber = async (
	session?: mongoose.ClientSession
): Promise<string> => {
	const today = dayjs().format('YYMMDD');
	let attempts = 0;
	const maxAttempts = 3;

	while (attempts < maxAttempts) {
		try {
			attempts++;

			// Use a session if provided, otherwise create a new one
			const useSession = session || (await mongoose.startSession());
			const useTransaction = !session; // Only start a transaction if we created the session

			try {
				if (useTransaction) {
					useSession.startTransaction();
				}

				// Atomically update the ID tracker with findOneAndUpdate
				const update = {
					$setOnInsert: { date: today, checkDigit: 0 },
					$inc: { lastSequence: 1 }
				};

				const options = {
					upsert: true,
					new: true,
					setDefaultsOnInsert: true,
					session: useSession
				};

				const updatedDoc = await IDTrackerModel.findOneAndUpdate(
					{ date: today },
					update,
					options
				);

				if (!updatedDoc) {
					throw new Error('Failed to update ID tracker document.');
				}

				// Destructure with type assertion
				const { lastSequence, checkDigit } = updatedDoc as IIDTracker;

				let sequenceStr = String(lastSequence).padStart(2, '0');
				let finalCheckDigit = checkDigit;

				// Reset sequence and increment check digit if sequence exceeds 99
				if (lastSequence > 99) {
					finalCheckDigit = (checkDigit + 1) % 10;
					await IDTrackerModel.findOneAndUpdate(
						{ date: today },
						{
							$set: {
								lastSequence: 1,
								checkDigit: finalCheckDigit
							}
						},
						{ session: useSession }
					);
					sequenceStr = '01'; // Start from 01 after reset
				}

				const generatedId = `${today}-${finalCheckDigit}-${sequenceStr}`;

				// Verify the ID doesn't already exist in the students collection
				const existingStudent = await StudentModel.findOne(
					{ registration_no: generatedId },
					null,
					{ session: useSession }
				);

				if (existingStudent) {
					logger.warn(
						`Generated ID ${generatedId} already exists in students collection. Retrying...`
					);

					if (useTransaction) {
						await useSession.abortTransaction();
					}

					// Try again with a new ID
					continue;
				}

				// Commit the transaction if we started one
				if (useTransaction) {
					await useSession.commitTransaction();
				}

				logger.info(`Successfully generated unique ID: ${generatedId}`);
				return generatedId;
			} catch (error) {
				// Abort the transaction if we started one
				if (useTransaction && useSession.inTransaction()) {
					await useSession.abortTransaction();
				}
				throw error;
			} finally {
				// End the session if we created it
				if (useTransaction) {
					useSession.endSession();
				}
			}
		} catch (error) {
			logger.error(
				`Error generating unique ID (attempt ${attempts}): ${error}`
			);

			if (attempts >= maxAttempts) {
				throw new Error(
					`Failed to generate unique ID after ${maxAttempts} attempts: ${error}`
				);
			}

			// Wait a short time before retrying
			await new Promise((resolve) => setTimeout(resolve, 100 * attempts));
		}
	}

	throw new Error(
		`Failed to generate unique ID after ${maxAttempts} attempts`
	);
};

/**
 * Reserves a batch of unique IDs for bulk operations
 * @param count Number of IDs to reserve
 * @returns Array of unique IDs
 */
export const reserveUniqueIds = async (count: number): Promise<string[]> => {
	if (count <= 0) {
		return [];
	}

	const session = await mongoose.startSession();
	try {
		session.startTransaction();

		const ids: string[] = [];
		for (let i = 0; i < count; i++) {
			const id = await generateUniqueRollNumber(session);
			ids.push(id);
		}

		await session.commitTransaction();
		return ids;
	} catch (error) {
		await session.abortTransaction();
		logger.error(`Failed to reserve ${count} unique IDs: ${error}`);
		throw error;
	} finally {
		session.endSession();
	}
};

/**
 * Simulates the generation of student IDs without persisting to the database
 * Useful for previewing the format and sequence of IDs that would be generated
 *
 * @param count Number of IDs to simulate
 * @param startDate Optional starting date (defaults to current date)
 * @param startSequence Optional starting sequence number (defaults to 1)
 * @param startCheckDigit Optional starting check digit (defaults to 0)
 * @returns Array of simulated IDs with metadata
 */
export const simulateIdGeneration = (
	count: number,
	startDate?: Date,
	startSequence: number = 1,
	startCheckDigit: number = 0
): Array<{
	id: string;
	date: string;
	sequence: number;
	checkDigit: number;
	index: number;
}> => {
	if (count <= 0) {
		return [];
	}

	const results: Array<{
		id: string;
		date: string;
		sequence: number;
		checkDigit: number;
		index: number;
	}> = [];

	const currentDate = startDate ? dayjs(startDate) : dayjs();
	let currentSequence = startSequence;
	let currentCheckDigit = startCheckDigit;

	for (let i = 0; i < count; i++) {
		const dateStr = currentDate.format('YYMMDD');

		// Format the sequence number with leading zeros
		const sequenceStr = String(currentSequence).padStart(2, '0');

		// Generate the ID
		const id = `${dateStr}-${currentCheckDigit}-${sequenceStr}`;

		// Add to results
		results.push({
			id,
			date: dateStr,
			sequence: currentSequence,
			checkDigit: currentCheckDigit,
			index: i + 1
		});

		// Increment sequence for next ID
		currentSequence++;

		// Check if we need to reset sequence and increment check digit
		if (currentSequence > 99) {
			currentSequence = 1;
			currentCheckDigit = (currentCheckDigit + 1) % 10;
		}

		// Optional: Simulate date change after a certain number of IDs
		// Uncomment if you want to simulate multiple days
		// if (i > 0 && i % 200 === 0) {
		//   currentDate = currentDate.add(1, 'day');
		//   currentSequence = 1;
		//   currentCheckDigit = 0;
		// }
	}

	return results;
};

/**
 * Simulates the generation of student IDs with actual database state
 * This performs a read-only operation to determine what IDs would be generated next
 *
 * @param count Number of IDs to simulate
 * @returns Array of simulated IDs with metadata
 */
export const previewNextIds = async (
	count: number
): Promise<
	Array<{
		id: string;
		date: string;
		sequence: number;
		checkDigit: number;
		index: number;
	}>
> => {
	if (count <= 0) {
		return [];
	}

	const today = dayjs().format('YYMMDD');

	// Get the current state without modifying it
	const currentTracker = await IDTrackerModel.findOne({ date: today }).lean();

	let startSequence = 1;
	let startCheckDigit = 0;

	if (currentTracker) {
		startSequence = (currentTracker.lastSequence || 0) + 1;
		startCheckDigit = currentTracker.checkDigit || 0;
	}

	// Use the pure simulation function with the current state
	return simulateIdGeneration(
		count,
		undefined,
		startSequence,
		startCheckDigit
	);
};

/**
 * Checks for potential ID collisions with existing student records
 *
 * @param simulatedIds Array of simulated IDs to check
 * @returns Array of IDs that would collide with existing records
 */
export const checkIdCollisions = async (
	simulatedIds: Array<{ id: string }>
): Promise<string[]> => {
	if (simulatedIds.length === 0) {
		return [];
	}

	const idValues = simulatedIds.map((item) => item.id);

	// Find any students with registration numbers matching the simulated IDs
	const existingStudents = await StudentModel.find({
		registration_no: { $in: idValues }
	})
		.select('registration_no')
		.lean();

	// Return the list of colliding IDs
	return existingStudents.map((student) => student.registration_no);
};

/**
 * Comprehensive dry run function that simulates ID generation and checks for collisions
 *
 * @param count Number of IDs to simulate
 * @returns Object containing simulation results and potential collisions
 */
export const dryRunIdGeneration = async (
	count: number
): Promise<{
	simulatedIds: Array<{
		id: string;
		date: string;
		sequence: number;
		checkDigit: number;
		index: number;
	}>;
	collisions: string[];
	summary: {
		totalSimulated: number;
		potentialCollisions: number;
		startDate: string;
		endDate: string;
		sequenceRange: string;
	};
}> => {
	// Generate the simulated IDs
	const simulatedIds = await previewNextIds(count);

	// Check for collisions
	const collisions = await checkIdCollisions(simulatedIds);

	// Create a summary
	const summary = {
		totalSimulated: simulatedIds.length,
		potentialCollisions: collisions.length,
		startDate: simulatedIds.length > 0 ? simulatedIds[0].date : '',
		endDate:
			simulatedIds.length > 0
				? simulatedIds[simulatedIds.length - 1].date
				: '',
		sequenceRange:
			simulatedIds.length > 0
				? `${simulatedIds[0].sequence}-${simulatedIds[simulatedIds.length - 1].sequence}`
				: ''
	};

	return {
		simulatedIds,
		collisions,
		summary
	};
};

export async function executeDryRun() {
	const dryRunResults = await dryRunIdGeneration(1000);
	logger.info(`Summary: ${JSON.stringify(dryRunResults.summary, null, 2)}`);
	logger.info(`Potential collisions: ${dryRunResults.collisions.length}`);
	if (dryRunResults.collisions.length > 0) {
		logger.info(`Colliding IDs: ${dryRunResults.collisions.join(', ')}`);
	}
	logger.info(
		`Simulated IDs: ${JSON.stringify(dryRunResults.simulatedIds.slice(0, 10), null, 2)}`
	);
}
