import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api/ApiError';
import { generateToken } from '@/lib/utils/tokens';
import {
	emailVerificationSuccess,
	reissueVerificationCodeEmail
} from '@/services/mail/mailTrap';
import { validate } from 'deep-email-validator';
import Tokens from '../tokens/token.model';
import { UserModel } from '../users/user.model';

class VerificationService {
	private static instance: VerificationService;
	constructor(
		private user: typeof UserModel,
		private token: typeof Tokens
	) {}

	static getInstance() {
		if (!VerificationService.instance) {
			VerificationService.instance = new VerificationService(
				UserModel,
				Tokens
			);
		}
		return VerificationService.instance;
	}
	async newUserVerification(code: string) {
		return withTransaction(async (session) => {
			/*<!-- 1. Check if token exists -->*/
			const token = await this.token
				.findOne({
					token: code,
					tokenType: 'VERIFICATION'
				})
				.session(session);

			if (!token) {
				throw new BadRequestError(
					'Invalid or expired verification code'
				);
			}

			/*<!-- 2. Find user by token -->*/
			const user = await this.user
				.findById(token.userId)
				.session(session)
				.lean();

			if (!user) {
				throw new BadRequestError('User not found');
			}

			/*<!-- 3. Check if user is verified -->*/
			if (user.isVerified) {
				throw new BadRequestError('User already verified');
			}

			/*<!-- 4. Verify user -->*/
			user.isVerified = true;
			user.verificationToken = null;
			user.verificationTokenExpiresAt = null;
			await user.save({ session });

			/*<!-- 5. Delete token -->*/
			await this.token.deleteOne({ _id: token._id }).session(session);

			await emailVerificationSuccess(user.email);

			return user;
		});
	}

	async reissueExpiredVerificationToken(email: string) {
		return withTransaction(async (session) => {
			const user = await this.user.findOne({ email }).session(session);

			/*<!-- 1. Check if user exists -->*/
			if (!user) {
				throw new BadRequestError('User not found');
			}

			/*<!-- 2. Check if user is verified -->*/
			if (user.isVerified) {
				throw new BadRequestError('User already verified');
			}

			/*<!-- 3. Validate email -->*/
			const isEmailValid = await validate(email);
			if (!isEmailValid.valid) {
				throw new BadRequestError('Invalid email');
			}

			/*<!-- 4. Check if verification token exists -->*/
			const token = await this.token.findOne({
				tokenType: 'VERIFICATION',
				userId: user._id
			});
			if (token) {
				await this.token.deleteOne({ _id: token._id }).session(session);
			}

			/*<!-- 5. Generate new token -->*/
			const { token: newToken, expiry } = generateToken();

			/*<!-- 6. Issue new token -->*/
			await this.token.issueVerificationToken(user._id, newToken);

			/*<!-- 7. Send reissue verification token email -->*/
			try {
				await reissueVerificationCodeEmail(user.name, email, newToken);
			} catch (error) {
				throw new BadRequestError(
					'Failed to send reissue verification token email'
				);
			}

			/*<!-- 8. Update user with new token -->*/
			user.verificationToken = newToken;
			user.verificationTokenExpiresAt = expiry;
			await user.save({ session });

			return {
				token: newToken
			};
		});
	}
}

export default VerificationService.getInstance();
