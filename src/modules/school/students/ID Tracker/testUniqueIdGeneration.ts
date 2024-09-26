import { Logger } from '@/lib/logger';
import { generateUniqueId } from './utils';

const logger = new Logger(__filename);

async function testGenerateUniqueId(n: number) {
	for (let i = 0; i < n; i++) {
		const uniqueId = await generateUniqueId();
		logger.debug(`Generated ID: ${uniqueId}`);
	}
}

export async function runTests() {
	logger.debug('Starting ID generation tests...');

	// Generate 5 IDs to see the initial sequence
	logger.debug('\nGenerating 5 IDs:');
	await testGenerateUniqueId(5);

	// Simulate a scenario to test the check digit increment (adjust your generateUniqueId function for this test temporarily if needed)
	logger.debug('\nSimulating check digit increment...');
	await testGenerateUniqueId(100); // Adjust based on your needs

	// Cleanup: Optionally, clear the IDTracker collection or reset the state if necessary for repeated tests

	// Close the MongoDB connection
}
