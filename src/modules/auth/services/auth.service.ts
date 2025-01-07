import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api';
import { config } from '@/lib/config';
import { Roles } from '@/lib/constants';
import { Logger } from '@/lib/logger';
import { signToken, verfication } from '@/lib/utils/tokens';
import {
	fetchUserPermissions,
	isAdminRolePresent,
	normalizeRoles
} from '@/lib/utils/utils';
import checkMXRecords from '@/services/dns-validation';
import { sendVerifyEmail } from '@/services/mail/mailTrap';
import { RoleModel } from '../roles/role.model';
import userSettingsService from '../settings/settings.service';
import Tokens from '../tokens/token.model';
import { User, UserModel } from '../users/user.model';

type UserDataObject = {
	user: User;

	isAdmin: boolean;
	isVerified: boolean;
	permissions: string[];
	settings: any;
	token: string | null;
	accessToken: string | undefined;
};

const logger = new Logger(__filename);
class AuthService {
	private static instance: AuthService;
	constructor(private readonly user: typeof UserModel) {}

	static getInstance() {
		if (!AuthService.instance) {
			AuthService.instance = new AuthService(UserModel);
		}
		return AuthService.instance;
	}

	/*<!-- 1. Register  ---------------------------( Auth )-> */
	async register(userDetails: Partial<User>, roleCode: Roles) {
		return withTransaction(async (session) => {
			// 1. Input validation
			if (!userDetails.email) {
				throw new BadRequestError('Email is required');
			}
			if (!userDetails.username) {
				throw new BadRequestError('Username is required');
			}
			if (!userDetails.name) {
				throw new BadRequestError('Name is required');
			}
			if (!roleCode) {
				throw new BadRequestError('Role is required');
			}

			// 2. Check for duplicates
			const duplicate = await this.user
				.findOne({
					$or: [
						{ email: userDetails.email },
						{ username: userDetails.username }
					]
				})
				.session(session);

			if (duplicate) {
				if (duplicate.email === userDetails.email) {
					throw new BadRequestError('Email already exists');
				} else if (duplicate.username === userDetails.username) {
					throw new BadRequestError('Username already exists');
				}
			}

			// 3. Validate email MX records
			const token = verfication.generateToken();
			if (!config.isTest) {
				const hasMxRecords = await checkMXRecords(userDetails.email);
				if (!hasMxRecords) {
					throw new BadRequestError('Invalid email domain');
				}
				// 5. Send verification email
				try {
					await sendVerifyEmail(
						userDetails.username,
						userDetails.email,
						token
					);
				} catch (error) {
					logger.error('Email sending failed:', error);
					throw new BadRequestError(
						'Failed to send verification email'
					);
				}
			}

			// 4. Generate verification token

			// 6. Get role
			const role = await RoleModel.findOne({ code: roleCode })
				.select('+code')
				.session(session)
				.lean()
				.exec();

			if (!role) {
				throw new BadRequestError('Role must be defined');
			}

			// 7. Create user
			const newUser = new this.user({
				username: userDetails.username,
				email: userDetails.email,
				name: userDetails.username,
				password: userDetails.password,
				verificationToken: token,
				verificationTokenExpiresAt: verfication.expiry,
				roles: role._id
			}) as User;

			const [user] = await this.user.create([newUser], { session });
			await Tokens.issueVerificationToken(user._id, token);
			// logger.debug(JSON.stringify(user, null, 2));

			// 8. Return result
			return {
				user: user.toObject()
			};
		});
	}

	/*<!-- 2. Login  ---------------------------( Auth )-> */
	async login(email: string, password: string) {
		return withTransaction(async (session) => {
			const user = await this.user.login(email, password);
			if (!user) {
				throw new BadRequestError('Invalid credentials');
			}
			const userObj = user.toObject();
			userObj.password = undefined;
			userObj.isPrime = user.isPrime || false;
			const payload = {
				user: userObj
			};
			const accessToken = signToken(payload, 'access', {
				expiresIn: '120m'
			});
			if (!accessToken) {
				throw new BadRequestError('Failed to generate access token');
			}
			user.lastLogin = new Date();
			await user.save({ session });
			await Tokens.addJwtToken(user._id, accessToken, session);
			const roles = normalizeRoles(userObj.roles);
			const isAdmin = await isAdminRolePresent(roles);
			const userSettings = await userSettingsService.getSettings(
				user._id
			);
			const roleCodes = await fetchUserPermissions(roles);
			if (!roleCodes) {
				throw new BadRequestError('No user found');
			}

			const dataObject: UserDataObject = {
				user: user,
				isAdmin,
				isVerified: user.isVerified || false,
				permissions: roleCodes,
				settings: userSettings,
				token: config.production ? null : accessToken,
				accessToken: accessToken
			};

			return dataObject;
		});
	}
}

export const authService = AuthService.getInstance();
