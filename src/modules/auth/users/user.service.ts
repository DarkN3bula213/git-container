import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api';
import { Roles } from '@/lib/constants';
import { signToken, verfication } from '@/lib/utils/tokens';
import {
	fetchRoleCodes,
	isAdminRolePresent,
	normalizeRoles
} from '@/lib/utils/utils';
import { RoleModel } from '../roles/role.model';
import { User, UserModel } from './user.model';

class UserService {
	private static instance: UserService;
	constructor(private user: typeof UserModel) {}

	static getInstance() {
		if (!UserService.instance) {
			UserService.instance = new UserService(UserModel);
		}
		return UserService.instance;
	}

	async getCurrentUser(user: User) {
		if (!user) {
			throw new BadRequestError('No user found');
		}
		const roles = normalizeRoles(user.roles);
		const roleCodes = (await fetchRoleCodes(roles)) as string[];
		if (!roleCodes) {
			throw new BadRequestError('No user found');
		}

		return {
			user: user,
			roles: [...roleCodes]
		};
	}

	async login(email: string, password: string) {
		const user = await this.user.login(email, password);
		if (!user) {
			throw new BadRequestError('Invalid credentials');
		}
		const userObj = user.toObject();
		const roles = normalizeRoles(userObj.roles);
		const roleCodes = await fetchRoleCodes(roles);
		if (!roleCodes) {
			throw new BadRequestError('No user found');
		}
		const data = {
			user: user,
			roles: [...roleCodes],
			isPremium: user.isPrime || false,
			isLoggedIn: true
		};
		const accessToken = signToken(data, 'access', {
			expiresIn: '120m'
		});

		const isAdmin = await isAdminRolePresent(roles);
		return {
			accessToken,
			user: user,
			permissions: [...roleCodes],
			isAdmin
		};
	}

	async createUser(userDetails: Partial<User>, roleCode: Roles) {
		return withTransaction(async (session) => {
			if (!userDetails.email || !userDetails.username || !roleCode) {
				throw new BadRequestError(
					!userDetails.email
						? 'Email is required'
						: 'Username is required'
				);
			}

			const duplicate = await this.user
				.findOne({
					$or: [
						{ email: userDetails.email },
						{
							username: userDetails.username
						}
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
			const token = verfication.generateToken();
			const role = await RoleModel.findOne({ code: roleCode })
				.select('+code')
				.session(session) // Ensure the session is used
				.lean()
				.exec();

			if (!role) throw new BadRequestError('Role must be defined');

			const newUser = new this.user({
				username: userDetails.username,
				email: userDetails.email,
				password: userDetails.password,
				verificationToken: token,
				verificationTokenExpiresAt: verfication.expiry,
				roles: role._id
			});

			const user = (await this.user.create([newUser], {
				session
			})) as User[];
			const userData = user[0].toObject();
			return {
				user: userData,
				token: token
			};
		});
	}
	// Partial update
	async updateUser(userID: string, userDetails: Partial<User>) {
		return withTransaction(async (session) => {
			const user = await this.user
				.findById(userID)
				.session(session)
				.lean()
				.exec();
			if (!user) {
				throw new BadRequestError('User not found');
			}
			const updatedUser = await this.user
				.findByIdAndUpdate(userID, userDetails, {
					new: true,
					session
				})
				.lean()
				.exec();
			return updatedUser;
		});
	}
	async generateVerificationToken(email: string, password: string) {
		return withTransaction(async (session) => {
			// Find the user by email
			const user = await this.user.findOne({ email }).session(session);

			if (!user) {
				throw new BadRequestError('User not found');
			}

		 

			// Verify the password
			const isPasswordValid = await user.comparePassword(password);
			if (!isPasswordValid) {
				throw new BadRequestError('Invalid password');
			}

			// Generate a new verification token
			const token = verfication.generateToken();
			const tokenExpiresAt = verfication.expiry;

			// Update the user with the new token
			await this.user.findByIdAndUpdate(
				user._id,
				{
					verificationToken: token,
					verificationTokenExpiresAt: tokenExpiresAt
				},
				{ session }
			);

			// TODO: Implement email sending logic here
			// await this.emailService.sendVerificationEmail(user.email, token);

			return {
				token
			};
		});
	}

	async changeEmail(userId: string, newEmail: string) {
		return withTransaction(async (session) => {
			const user = await this.user.findById(userId).session(session);
			if (!user) {
				throw new BadRequestError('User not found');
			}

			const existingUser = await this.user
				.findOne({ email: newEmail })
				.session(session);
			if (existingUser) {
				throw new BadRequestError('Email already in use');
			}

			const token = verfication.generateToken();
			const tokenExpiresAt = verfication.expiry;

			const newUser = await this.user.findByIdAndUpdate(
				user._id,
				{
					pendingEmail: newEmail,
					verificationToken: token,
					verificationTokenExpiresAt: tokenExpiresAt
				},
				{ new: true, session }
			);

			return { token, newUser };
		});
	}
	async changePassword(
		userId: string,
		oldPassword: string,
		newPassword: string
	) {
		return withTransaction(async (session) => {
			const user = await this.user.findById(userId).session(session);
			if (!user) {
				throw new BadRequestError('User not found');
			}

			const isPasswordValid = await user.comparePassword(oldPassword);
			if (!isPasswordValid) {
				throw new BadRequestError('Invalid old password');
			}
			if (
				user.lastPasswordChange &&
				user.lastPasswordChange >
					new Date(new Date().getTime() - 1000 * 60 * 60 * 24)
			) {
				throw new BadRequestError(
					'You must wait 24 hours before changing your password again'
				);
			}

			user.password = newPassword;
			user.lastPasswordChange = new Date();
			await user.save({ session });
		});
	}
}

export const service = UserService.getInstance() as UserService;
