import { env } from './env';

// Helper for converting base64 encoded values
const decoded = (value: string): string => {
	return Buffer.from(value, 'base64').toString('ascii');
};

// Determine if environment is production-like
const isProduction = env.NODE_ENV === 'production' || env.NODE_ENV === 'docker';

// Create the config object with type safety
export const config = {
	// Environment info
	node: env.NODE_ENV,
	isProduction,
	isTest: env.NODE_ENV === 'test',
	isJest: env.NODE_ENV === 'jest',
	disengage: env.DISENGAGE,
	isDocker: env.NODE_ENV === 'docker',
	isDevelopment: env.NODE_ENV === 'development',
	showScope: env.SHOW_SCOPE === 'true',

	// App settings
	app: {
		port: env.PORT,
		mappedIP: env.MAPPED_IP
	},

	// CORS settings
	cors: {
		origin: 'http://localhost:5173/',
		credentials: true,
		methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
		allowedHeaders: [
			'Content-Type',
			'x-api-key',
			'Authorization',
			'x-access-token'
		],
		exposedHeaders: ['Set-Cookie']
	},

	// Origin URL
	origin: env.ORIGIN_URL,

	// URL encoding settings
	urlEncoded: {
		limit: '10mb',
		extended: true,
		parameterLimit: 50000
	},

	// JSON settings
	json: {
		limit: '25mb'
	},

	// Logging configuration
	log: {
		level: env.LOG_LEVEL,
		directory: env.LOG_DIR,
		logtail: env.LOGTAIL_TOKEN
	},

	// MongoDB configuration
	mongo: {
		host: env.DB_HOST,
		user: env.DB_USER,
		pass: env.DB_PASSWORD,
		port: env.DB_PORT,
		database: env.DB_NAME,
		pool: {
			min: env.DB_POOL_MIN,
			max: env.DB_POOL_MAX
		},
		uri: `mongodb://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
		dev: `mongodb://${env.DB_USER}:${env.DB_PASSWORD}@127.0.0.1:${env.DB_PORT}/${env.DB_NAME}?authSource=admin`,
		docker: `mongodb://${env.DB_USER}:${env.DB_PASSWORD}@mongo:${env.DB_PORT}/${env.DB_NAME}?authSource=admin`,
		url: env.DB_URI
	},

	// Redis configuration
	redis: {
		host: env.REDIS_HOST,
		user: env.REDIS_USER,
		pass: env.REDIS_PASS,
		port: env.REDIS_PORT,
		uri: env.REDIS_URL
	},

	// Authentication tokens
	tokens: {
		jwtSecret: env.JWT_SECRET,
		access: {
			private: decoded(env.ACCESS_PRIVATE),
			public: decoded(env.ACCESS_PUBLIC),
			ttl: env.ACCESS_TTL
		},
		refresh: {
			private: decoded(env.REFRESH_PRIVATE),
			public: decoded(env.REFRESH_PUBLIC),
			ttl: env.REFRESH_TTL
		}
	},

	// Cookie options function
	cookieOptions: () => {
		return {
			httpOnly: true,
			secure: true,
			sameSite: 'none',
			maxAge: 2 * 60 * 60 * 1000, // 2 hours
			domain: '.hps-admin.com'
		};
	},

	// Supabase configuration
	supabase: {
		url: env.SUPABASE_URL,
		key: env.SUPABASE_KEY
	},

	// Mail configuration
	mail: {
		host: env.EMAIL_HOST,
		port: env.EMAIL_PORT,
		token: env.MAILTRAP_TOKEN,
		address: env.SENDER_EMAIL,
		url: env.CLIENT_URL,
		adminEmail: env.ADMIN_EMAIL,
		auth: {
			user: env.EMAIL_USER,
			pass: env.EMAIL_PASS
		},
		test: {
			inboxId: env.MAILTRAP_INBOX_ID,
			token: env.MAILTRAP_TOKEN,
			adminEmail: env.MAILTRAP_ADMIN_EMAIL
		},
		paymentSummarySubject: env.PAYMENT_SUMMARY_SUBJECT
	},

	// CNIC configuration
	cnic: {
		numberOne: env.CNIC_ONE,
		numberTwo: env.CNIC_TWO,
		numberThree: env.CNIC_THREE
	}
} as const;

// Export type for IDE auto-completion
export type Config = typeof config;
