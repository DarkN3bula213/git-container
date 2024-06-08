import { BadRequestError } from '@/lib/api';
import { RoleModel } from '../roles/role.model';
import { User, UserModel } from './user.model';
import {
  fetchRoleCodes,
  isAdminRolePresent,
  normalizeRoles,
} from '@/lib/utils/utils';

import { signToken } from '@/lib/utils/tokens';

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
    const roleCodes = await fetchRoleCodes(roles);
    if (!roleCodes) {
      throw new BadRequestError('No user found');
    }

    return {
      user: user,
      roles: [...roleCodes],
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
      isLoggedIn: true,
    };
    const accessToken = signToken(data, 'access', {
      expiresIn: '120m',
    });

    const isAdmin = await isAdminRolePresent(roles);
    return {
      accessToken,
      user: user,
      permissions: [...roleCodes],
      isAdmin,
    };
  }
}

export const service = UserService.getInstance();
