export const allowedOrigins = [
	'https://hps-admin.com',
	'https://hps-five.vercel.app',
	'http://localhost:5173',
	'http://localhost:3000',
	'http://192.168.100.118:5173'
];

export const headers = [
	'Origin',
	'Content-Type',
	'Accept',
	'Authorization',
	'x-api-key',
	'x-refresh-token',
	'x-access-token',
	'Acess-Control-Allow-Origin'
];

export const methods = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';

export const origins = {
	// development
	dev: allowedOrigins,
	// production No HTTP access
	prod: [
		'https://hps-admin.com',
		'https://hps-five.vercel.app',
		'https://hps-git-staging-darkn3bula213s-projects.vercel.app'
	]
};
