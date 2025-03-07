import { Logger } from '@/lib/logger';
import crypto from 'crypto';
import { Document, Schema, model } from 'mongoose';

// Interface for the counter document
interface ICounter extends Document {
	name: string;
	sequence: number;
	prefix: string;
	lastUpdated: Date;
}

// Schema for the counter collection
const GeneratorSchema = new Schema<ICounter>({
	name: { type: String, required: true, unique: true },
	sequence: { type: Number, default: 0 },
	prefix: { type: String, required: true },
	lastUpdated: { type: Date, default: Date.now }
});

// Create the model
const Generator = model<ICounter>('Generator', GeneratorSchema);

class InvoiceIdGenerator {
	private counterName: string;
	private paddingLength: number;
	private randomChars: number;

	/**
	 * Creates an instance of InvoiceIdGenerator.
	 * @param {string} counterName - The name of the counter to use (e.g., 'invoice')
	 * @param {number} paddingLength - The length to pad the sequential number (default: 3)
	 * @param {number} randomChars - Number of random characters to add for security (default: 3)
	 */
	constructor(
		counterName: string = 'invoice',
		paddingLength: number = 3,
		randomChars: number = 3
	) {
		this.counterName = counterName;
		this.paddingLength = paddingLength;
		this.randomChars = randomChars;
	}

	/**
	 * Generates a random string of alphanumeric characters
	 * @param {number} length - Length of random string to generate
	 * @returns {string} Random alphanumeric string
	 */
	private generateRandomString(length: number): string {
		// Use only uppercase letters and numbers, excluding easily confused characters
		const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
		let result = '';

		// Use crypto for more secure random generation
		const randomBytes = crypto.randomBytes(length);
		for (let i = 0; i < length; i++) {
			result += chars[randomBytes[i] % chars.length];
		}

		return result;
	}

	/**
	 * Initializes or updates the counter prefix
	 * @returns {Promise<string>} The current prefix
	 */
	private async ensureCounter(): Promise<string> {
		const currentDate = new Date();
		const year = currentDate.getFullYear().toString().slice(2);
		const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
		const randomPart = this.generateRandomString(2);

		// Create a unique prefix that changes monthly but isn't easily guessable
		const newPrefix = `${randomPart}${year}${month}`;

		try {
			// Find the counter, update if needed
			const generator = await Generator.findOne({
				name: this.counterName
			});

			if (!generator) {
				// If counter doesn't exist, create it
				await Generator.create({
					name: this.counterName,
					sequence: 0,
					prefix: newPrefix,
					lastUpdated: currentDate
				});
				return newPrefix;
			}

			// Check if we need to update the prefix (e.g., new month)
			const generatorMonth = generator.lastUpdated.getMonth();
			const generatorYear = generator.lastUpdated.getFullYear();

			if (
				generatorMonth !== currentDate.getMonth() ||
				generatorYear !== currentDate.getFullYear()
			) {
				// Reset sequence and update prefix for new month/year
				generator.sequence = 0;
				generator.prefix = newPrefix;
				generator.lastUpdated = currentDate;
				await generator.save();
			}

			return generator.prefix;
		} catch (error) {
			console.error('Error ensuring counter:', error);
			throw new Error('Failed to initialize or update counter');
		}
	}

	/**
	 * Generates the next sequential invoice ID
	 * @returns {Promise<string>} Generated invoice ID
	 */
	async generateId(): Promise<string> {
		try {
			// Ensure counter is initialized with current prefix
			const prefix = await this.ensureCounter();

			// Get and increment the sequence atomically
			const result = await Generator.findOneAndUpdate(
				{ name: this.counterName },
				{ $inc: { sequence: 1 } },
				{ new: true }
			);

			if (!result) {
				throw new Error('Failed to increment counter');
			}

			// Format the sequential part
			const sequentialPart = result.sequence
				.toString()
				.padStart(this.paddingLength, '0');

			// Add some randomness for security
			const randomPart = this.generateRandomString(this.randomChars);

			// Format: INV-PREFIX-SEQUENTIAL-RANDOM
			return `INV-${prefix}-${sequentialPart}-${randomPart}`;
		} catch (error) {
			console.error('Error generating invoice ID:', error);
			throw new Error('Failed to generate invoice ID');
		}
	}

	/**
	 * Generates multiple IDs at once (useful for batch operations)
	 * @param {number} count - Number of IDs to generate
	 * @returns {Promise<string[]>} Array of generated IDs
	 */
	async generateBatch(count: number): Promise<string[]> {
		if (count <= 0) {
			throw new Error('Count must be greater than zero');
		}

		try {
			// Get the current prefix
			const prefix = await this.ensureCounter();

			// Increment the counter by the count and get the new value
			const result = await Generator.findOneAndUpdate(
				{ name: this.counterName },
				{ $inc: { sequence: count } },
				{ new: true }
			);

			if (!result) {
				throw new Error('Failed to increment counter for batch');
			}

			const endSequence = result.sequence;
			const startSequence = endSequence - count + 1;

			// Generate IDs
			const ids: string[] = [];
			for (let i = 0; i < count; i++) {
				const currentSequence = startSequence + i;
				const sequentialPart = currentSequence
					.toString()
					.padStart(this.paddingLength, '0');
				const randomPart = this.generateRandomString(this.randomChars);
				ids.push(`INV-${prefix}-${sequentialPart}-${randomPart}`);
			}

			return ids;
		} catch (error) {
			console.error('Error generating batch of invoice IDs:', error);
			throw new Error('Failed to generate batch of invoice IDs');
		}
	}

	/**
	 * Resets the counter (useful for testing)
	 * @returns {Promise<void>}
	 */
	async resetCounter(): Promise<void> {
		try {
			await Generator.deleteOne({ name: this.counterName });
		} catch (error) {
			console.error('Error resetting counter:', error);
			throw new Error('Failed to reset counter');
		}
	}
}

export default InvoiceIdGenerator;

/**
 * Example Usage
 *
 *  <!>Initialize the generator<!>
 *  const invoiceIdGenerator = new InvoiceIdGenerator();
 *
 *  <!>Generate a single ID<!>
 *  const id = await invoiceIdGenerator.generateId();
 *  Example: INV-XZ2503-001-A7B
 *
 *  <!>Generate multiple IDs<!>
 *  const batchIds = await invoiceIdGenerator.generateBatch(5);
 */

const logger = new Logger('InvoiceIdGenerator');

export const testInvoiceIdGenerator = async () => {
	const invoiceIdGenerator = new InvoiceIdGenerator('invoice', 3, 3);

	const id = await invoiceIdGenerator.generateId();
	logger.info(`Generated ID: ${id}`);

	const batchIds = await invoiceIdGenerator.generateBatch(5);
	logger.info(`Generated batch IDs: ${JSON.stringify(batchIds, null, 2)}`);

	await invoiceIdGenerator.resetCounter();
	logger.info('Counter reset');
};
