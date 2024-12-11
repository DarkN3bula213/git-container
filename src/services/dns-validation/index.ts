import { Logger } from '@/lib/logger';
import { validate } from 'deep-email-validator';
import dns from 'dns';
import { promisify } from 'util';

const logger = new Logger(__filename);
const resolveMx = promisify(dns.resolveMx);

async function checkMXRecords(email: string): Promise<boolean> {
	if (!isEmailValid(email)) {
		logger.error({ email: 'Invalid email' });
		return false;
	}

	// Validate the email
	const validationResult = await validate(email);
	if (!validationResult.valid) {
		logger.error({ email: 'Invalid email' });
		return false;
	}

	try {
		const domain = email.split('@')[1];
		const addresses = await resolveMx(domain);

		if (!addresses || addresses.length === 0) {
			logger.error('No MX records found for domain:', domain);
			return false;
		}

		return true;
	} catch (error) {
		logger.error('Invalid domain or DNS resolution failed:', error);
		return false;
	}
}

export default checkMXRecords;

const emailRegex =
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isEmailValid(email: string) {
	// Check if the email is defined and not too long
	if (!email || email.length > 254) return false;

	// Use a single regex check for the standard email parts
	if (!emailRegex.test(email)) return false;

	// Split once and perform length checks on the parts
	const parts = email.split('@');
	if (parts[0].length > 64) return false;

	// Perform length checks on domain parts
	const domainParts = parts[1].split('.');
	if (domainParts.some((part) => part.length > 63)) return false;

	// If all checks pass, the email is valid
	return true;
}
