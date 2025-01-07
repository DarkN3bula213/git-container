import { createMockApiKey } from './mocks';
import { request } from './utils';

const defaultHeaders = {
	Origin: 'http://localhost:3000'
	// 'x-api-key': 'your-api-key-here'
};

describe('Valid Api Key should pass the health check', () => {
	it('should return 403 if API key is missing', async () => {
		const res = await request
			.get('/api/health')
			.set('Origin', 'http://localhost:3000');
		console.log(res.body);

		expect(res.status).toBe(400);
		expect(res.body.message).toBe('x-api-key is required');
	});
});

describe('Valid Api Key should pass the health check', async () => {
	// Add the api key to the db
	const apiKey = await createMockApiKey();
	console.log(apiKey);
	defaultHeaders['x-api-key'] = apiKey;

	it('should return 200 if API key is valid', async () => {
		const res = await request.get('/api/health').set(defaultHeaders);

		expect(res.status).toBe(200);
	});
});
