import { UserModel as User } from '../../src/modules/auth/users/user.model';

export const validUser = {
	username: 'testuser',
	name: 'testuser',
	email: 'email@gmail.com',
	password: 'test12123'
};

export const createUser = async () => {
	const user = await User.create(validUser);
	return user;
};
