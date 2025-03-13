import * as dotenv from 'dotenv';
import * as path from 'path';
import * as z from 'zod';

// Load .env file
const envPath = path.join(
	process.cwd(),
	`.env${process.env.NODE_ENV === 'test' ? '.test' : ''}`
);

const result = dotenv.config({ path: envPath });
if (result.error) {
	console.warn(`⚠️  Warning: No .env file found at ${envPath}`);
}

// Helper function to handle missing environment variables
const requiredVar = (name: string) => {
	const value = process.env[name];
	if (!value && process.env.NODE_ENV === 'production') {
		throw new Error(`Environment variable ${name} is not set.`);
	}
	return value ?? '';
};

// Define environment schema with zod
export const envSchema = z.object({
	// Node environment
	NODE_ENV: z
		.enum(['development', 'production', 'test', 'docker', 'jest'])
		.default('development'),

	// App settings
	PORT: z.coerce.number().default(3000),
	MAPPED_IP: z.string().default('::ffff:127.0.0.1'),
	ORIGIN_URL: z.string(),
	DISENGAGE: z.string().default('false'),
	SHOW_SCOPE: z.string().default('false'),

	// Database
	DB_HOST: z.string(),
	DB_USER: z.string(),
	DB_PASSWORD: z.string(),
	DB_PORT: z.coerce.number(),
	DB_NAME: z.string(),
	DB_POOL_MIN: z.coerce.number().default(0),
	DB_POOL_MAX: z.coerce.number().default(10),
	DB_URI: z.string(),

	// Redis
	REDIS_HOST: z.string(),
	REDIS_USER: z.string(),
	REDIS_PASS: z.string(),
	// REDIS_PORT: z.coerce.number(),
	REDIS_URL: z.string(),

	// JWT Tokens
	JWT_SECRET: z.string(),
	ACCESS_PRIVATE: z.string(),
	ACCESS_PUBLIC: z.string(),
	ACCESS_TTL: z.string(),
	REFRESH_PRIVATE: z.string(),
	REFRESH_PUBLIC: z.string(),
	REFRESH_TTL: z.string(),

	// Logging
	LOG_LEVEL: z.string().default('debug'),
	LOG_DIR: z.string().default(path.join(process.cwd(), 'logs')),
	LOGTAIL_TOKEN: z.string(),

	// Supabase
	SUPABASE_URL: z.string(),
	SUPABASE_KEY: z.string(),

	// Email
	EMAIL_HOST: z.string(),
	EMAIL_PORT: z.coerce.number(),
	EMAIL_USER: z.string(),
	EMAIL_PASS: z.string(),
	MAILTRAP_TOKEN: z.string(),
	SENDER_EMAIL: z.string(),
	CLIENT_URL: z.string(),
	ADMIN_EMAIL: z.string(),
	MAILTRAP_INBOX_ID: z.string(),
	MAILTRAP_ADMIN_EMAIL: z.string(),
	PAYMENT_SUMMARY_SUBJECT: z.string().default('Payment Summary'),

	// CNIC
	CNIC_ONE: z.string(),
	CNIC_TWO: z.string(),
	CNIC_THREE: z.string()
});

// Parse environment variables
export const env = envSchema.parse({
	NODE_ENV: process.env.NODE_ENV,
	PORT: process.env.PORT,
	MAPPED_IP: process.env.MAPPED_IP,
	ORIGIN_URL: requiredVar('ORIGIN_URL'),
	DISENGAGE: process.env.DISENGAGE,
	SHOW_SCOPE: process.env.SHOW_SCOPE,

	DB_HOST: requiredVar('DB_HOST'),
	DB_USER: requiredVar('DB_USER'),
	DB_PASSWORD: requiredVar('DB_PASSWORD'),
	DB_PORT: requiredVar('DB_PORT'),
	DB_NAME: requiredVar('DB_NAME'),
	DB_POOL_MIN: process.env.DB_POOL_MIN,
	DB_POOL_MAX: process.env.DB_POOL_MAX,
	DB_URI: requiredVar('DB_URI'),

	REDIS_HOST: requiredVar('REDIS_HOST'),
	REDIS_USER: requiredVar('REDIS_USER'),
	REDIS_PASS: requiredVar('REDIS_PASS'),
	// REDIS_PORT: requiredVar('REDIS_PORT'),
	REDIS_URL: requiredVar('REDIS_URL'),

	JWT_SECRET: requiredVar('JWT_SECRET'),
	ACCESS_PRIVATE: requiredVar('ACCESS_PRIVATE'),
	ACCESS_PUBLIC: requiredVar('ACCESS_PUBLIC'),
	ACCESS_TTL: requiredVar('ACCESS_TTL'),
	REFRESH_PRIVATE: requiredVar('REFRESH_PRIVATE'),
	REFRESH_PUBLIC: requiredVar('REFRESH_PUBLIC'),
	REFRESH_TTL: requiredVar('REFRESH_TTL'),

	LOG_LEVEL: process.env.LOG_LEVEL,
	LOG_DIR: process.env.LOG_DIR,
	LOGTAIL_TOKEN: requiredVar('LOGTAIL_TOKEN'),

	SUPABASE_URL: requiredVar('SUPABASE_URL'),
	SUPABASE_KEY: requiredVar('SUPABASE_KEY'),

	EMAIL_HOST: requiredVar('EMAIL_HOST'),
	EMAIL_PORT: requiredVar('EMAIL_PORT'),
	EMAIL_USER: requiredVar('EMAIL_USER'),
	EMAIL_PASS: requiredVar('EMAIL_PASS'),
	MAILTRAP_TOKEN: requiredVar('MAILTRAP_TOKEN'),
	SENDER_EMAIL: requiredVar('SENDER_EMAIL'),
	CLIENT_URL: requiredVar('CLIENT_URL'),
	ADMIN_EMAIL: requiredVar('ADMIN_EMAIL'),
	MAILTRAP_INBOX_ID: requiredVar('MAILTRAP_INBOX_ID'),
	MAILTRAP_ADMIN_EMAIL: requiredVar('MAILTRAP_ADMIN_EMAIL'),
	PAYMENT_SUMMARY_SUBJECT: process.env.PAYMENT_SUMMARY_SUBJECT,

	CNIC_ONE: requiredVar('CNIC_ONE'),
	CNIC_TWO: requiredVar('CNIC_TWO'),
	CNIC_THREE: requiredVar('CNIC_THREE')
});

// Export type for TypeScript
export type Env = z.infer<typeof envSchema>;
