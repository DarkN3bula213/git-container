 
import { defaultHeaders, request } from '../utils';
import { validUser } from './auth.utils';

 
describe('Tests for user authentication', () => {
	it('Create user', async () => {
		const res = await request
			.post('/api/users/register')
			.send(validUser)
			.set(defaultHeaders);
		console.log(res.body);
		expect(res.status).toBe(200);
		expect(res.body.message).toBe('User created successfully');
	});
	// describe('Login user', () => {});
	// describe('Logout user', () => {});
	// describe('Get user', () => {});
});
