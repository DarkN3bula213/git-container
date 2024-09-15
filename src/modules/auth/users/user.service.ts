import { BadRequestError } from '@/lib/api';
import { RoleModel } from '../roles/role.model';
import { User, UserModel } from './user.model';
import {
    fetchRoleCodes,
    isAdminRolePresent,
    normalizeRoles
} from '@/lib/utils/utils';

import { signToken, verfication } from '@/lib/utils/tokens';
import { Roles } from '@/lib/constants';
import { withTransaction } from '@/data/database/db.utils';
import { sendVerifyEmail } from '@/services/mail/mailTrap';

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
}

export const service = UserService.getInstance();
