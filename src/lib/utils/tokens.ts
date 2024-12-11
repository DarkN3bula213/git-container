import { User, findUserById } from '@/modules/auth/users/user.model';
import { InvoiceProps } from '@/types';
import dayjs from 'dayjs';
import { SignOptions, sign, verify } from 'jsonwebtoken';
import { createHmac, randomBytes } from 'node:crypto';
import { config } from '../config';
import { Logger as log } from '../logger/logger';

const logger = new log(__filename);

interface TokenPayload {
	user: User;
	session?: string;
	isPrime?: boolean;
}
interface TokenVerificationResult {
	valid: boolean;
	expired: boolean;
	decoded: TokenPayload | null;
}
export function signToken(
	payload: TokenPayload,
	key: 'access' | 'refresh',
	options?: SignOptions | undefined
) {
	const signingKey = config.tokens[key].private;

	const token = sign(payload, signingKey, {
		...(options && options),
		algorithm: 'RS256'
	});

	return token;
}

export function verifyToken(
	token: string,
	key: 'access' | 'refresh'
): TokenVerificationResult {
	const verifyKey = config.tokens[key].public;

	try {
		const decoded = verify(token, verifyKey);

		if (!decoded) {
			return {
				valid: false,
				expired: false,
				decoded: null
			};
		}

		return {
			valid: true,
			expired: false,
			decoded: decoded as TokenPayload
		};
	} catch (e: any) {
		let expired = false;
		let errorMessage = 'Invalid token';

		if (e.message === 'jwt expired') {
			expired = true;
			const expiredAt = dayjs(e.expiredAt);
			const now = dayjs();
			const formattedExpiryTime = expiredAt.format('YYYY-MM-DD HH:mm:ss');
			const timeAgo = now.diff(expiredAt, 'hour');
			errorMessage = `Token is expired since ${formattedExpiryTime} (${timeAgo} hours ago)`;
		}

		logger.error(`errorMessage: ${errorMessage}`);

		return {
			valid: false,
			expired,
			decoded: null
		};
	}
}

export async function reIssueAccessToken({
	refreshToken
}: {
	refreshToken: string;
}) {
	const { decoded, valid, expired } = verifyToken(refreshToken, 'refresh');

	// Check for validity of the refresh token
	if (!valid) {
		return false;
	}

	// Check for expiry of the refresh token
	if (expired) {
		logger.debug('Refresh token has expired');
		return false;
	}

	if (decoded && decoded.user) {
		const verifiedUser = await findUserById(decoded.user._id.toString());
		if (!verifiedUser) {
			return false;
		}

		const accessToken = signToken(
			{ user: verifiedUser } as TokenPayload,
			'access',
			{ expiresIn: config.tokens.access.ttl } // Adjust the TTL as necessary
		);

		if (config.isDevelopment) {
			logger.warn({
				token: `Issues to user ${verifiedUser._id}`
			});
		}
		return accessToken;
	}
}

/* -----------------------------( Token Generator )-----!>
 *
 * ----------( QRCode )->
 */

export function generateInvoiceToken(payload: InvoiceProps) {
	const signingKey = config.tokens.refresh.private;
	const token = sign({ ...payload }, signingKey, {
		algorithm: 'RS256',
		noTimestamp: true
	});
	return token;
}

/*
 * ----------( Verification Token )->
 */
const verificationToken = Math.floor(
	100000 + Math.random() * 900000
).toString();

/*
 * ----------( Email Verification Token )->
 */

function generateVerifyEmailToken(): string {
	const buffer = randomBytes(3); // Generate 3 bytes, which gives a number up to 16777215
	const token = parseInt(buffer.toString('hex'), 16) % 1000000; // Convert to integer and ensure it's a 6-digit number
	return token.toString().padStart(6, '0'); // Ensure it's always 6 digits by padding with zeros if necessary
}
const tokenExpiryTime = Date.now() + 24 * 60 * 60 * 1000;

/*
 * ----------( Generate Reset Token )->
 */

const generateSecureResetToken = (): string => {
	const token = randomBytes(20).toString('hex');
	const hmac = createHmac(
		'sha256',
		process.env.RESET_TOKEN_SECRET || 'default_secret_key'
	);
	return hmac.update(token).digest('hex');
};

export const verfication = {
	token: verificationToken,
	resetToken: generateSecureResetToken,
	generateToken: generateVerifyEmailToken,
	expiry: tokenExpiryTime
};

interface GenerateTokenReturn {
	token: string;
	expiry: Date;
}

export const generateToken = (): GenerateTokenReturn => {
	const token = verfication.generateToken();
	const expiry = new Date(verfication.expiry);
	return { token, expiry };
};
