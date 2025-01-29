import * as dotenv from 'dotenv';
import * as path from 'node:path';
import {
	getDecodedOsEnv,
	getDevelopmentEnv,
	getOsEnv, // getOsEnvOptional,
	normalizePort,
	toNumber
} from './utils';

// First, create a Config class
class Config {
	private static instance: Config;
	private readonly config: any;

	private constructor() {
		// Load environment variables first
		const envPath = path.join(
			process.cwd(),
			`.env${process.env.NODE_ENV === 'test' ? '.test' : ''}`
		);

		// Load and verify environment
		const result = dotenv.config({ path: envPath });

		if (result.error) {
			console.warn(`⚠️  Warning: No .env file found at ${envPath}`);
		}

		this.config = {
			node: this.getNodeEnv(),
			isProduction:
				this.getNodeEnv() === 'production' ||
				this.getNodeEnv() === 'docker',
			isTest: this.getNodeEnv() === 'test',
			isJest: this.getNodeEnv() === 'jest',
			disengage: process.env.DISENGAGE || 'false',
			isDocker: this.getNodeEnv() === 'docker',
			isDevelopment: this.getNodeEnv() === 'development',
			// production: this.getNodeEnv() === 'production',
			app: {
				port: normalizePort(process.env.PORT || '3000'), // Provide a default port
				mappedIP: getDevelopmentEnv('MAPPED_IP', '::ffff:127.0.0.1')
			},
			cors: {
				origin: 'http://localhost:5173/',
				credentials: true,

				methods: [
					'GET',
					'HEAD',
					'PUT',
					'PATCH',
					'POST',
					'DELETE',
					'OPTIONS'
				],
				allowedHeaders: [
					'Content-Type',
					'x-api-key',
					'Authorization',
					'x-access-token'
				],
				exposedHeaders: ['Set-Cookie']
			},

			origin: getOsEnv('ORIGIN_URL'),
			urlEncoded: {
				limit: '10mb',
				extended: true,
				parameterLimit: 50000
			},
			json: {
				limit: '25mb'
			},
			log: {
				level: process.env.LOG_LEVEL || 'debug',
				directory:
					process.env.LOG_DIR || path.join(process.cwd(), 'logs')
			},
			mongo: {
				host: getOsEnv('DB_HOST'),
				user: getOsEnv('DB_USER'),
				pass: getOsEnv('DB_PASSWORD'),
				port: getOsEnv('DB_PORT'),
				database: getOsEnv('DB_NAME'),
				pool: {
					min: toNumber(getOsEnv('DB_POOL_MIN')),
					max: toNumber(getOsEnv('DB_POOL_MAX'))
				},
				uri: `mongodb://${getOsEnv('DB_USER')}:${getOsEnv('DB_PASSWORD')}@${getOsEnv('DB_HOST')}:${getOsEnv('DB_PORT')}/${getOsEnv('DB_NAME')}`,
				dev: `mongodb://${getOsEnv('DB_USER')}:${getOsEnv('DB_PASSWORD')}@127.0.0.1:${getOsEnv('DB_PORT')}/${getOsEnv('DB_NAME')}?authSource=admin`,
				docker: `mongodb://${getOsEnv('DB_USER')}:${getOsEnv('DB_PASSWORD')}@mongo:${getOsEnv('DB_PORT')}/${getOsEnv('DB_NAME')}?authSource=admin`,
				url: getOsEnv('DB_URI')
			},
			redis: {
				host: getOsEnv('REDIS_HOST'),
				user: getOsEnv('REDIS_USER'),
				pass: getOsEnv('REDIS_PASS'),
				port: toNumber(getOsEnv('REDIS_PORT')),
				uri: getOsEnv('REDIS_URL')
			},
			tokens: {
				jwtSecret: getOsEnv('JWT_SECRET'),
				access: {
					private: getDecodedOsEnv('ACCESS_PRIVATE'),
					public: getDecodedOsEnv('ACCESS_PUBLIC'),
					ttl: getOsEnv('ACCESS_TTL')
				},
				refresh: {
					private: getDecodedOsEnv('REFRESH_PRIVATE'),
					public: getDecodedOsEnv('REFRESH_PUBLIC'),
					ttl: getOsEnv('REFRESH_TTL')
				}
			},
			cookieOptions: () => {
				return {
					httpOnly: true,
					secure: true,
					sameSite: 'none',
					maxAge: 2 * 60 * 60 * 1000, // 2 hours
					domain: '.hps-admin.com'
				};
			},
			supabase: {
				url: getOsEnv('SUPABASE_URL'),
				key: getOsEnv('SUPABASE_KEY')
			},
			mail: {
				host: getOsEnv('EMAIL_HOST'),
				port: toNumber(getOsEnv('EMAIL_PORT')),
				token: getOsEnv('MAILTRAP_TOKEN'),
				address: getOsEnv('SENDER_EMAIL'),
				url: getOsEnv('CLIENT_URL'),
				adminEmail: getOsEnv('ADMIN_EMAIL'),

				auth: {
					user: getOsEnv('EMAIL_USER'),
					pass: getOsEnv('EMAIL_PASS')
				},
				test: {
					inboxId: getOsEnv('MAILTRAP_INBOX_ID'),
					token: getOsEnv('MAILTRAP_TOKEN'),
					adminEmail: getOsEnv('MAILTRAP_ADMIN_EMAIL')
				},
				paymentSummarySubject: getDevelopmentEnv(
					'PAYMENT_SUMMARY_SUBJECT',
					'Payment Summary'
				)
			},
			cnic: {
				numberOne: getOsEnv('CNIC_ONE'),
				numberTwo: getOsEnv('CNIC_TWO'),
				numberThree: getOsEnv('CNIC_THREE')
			}
		};

		this.validateConfig();
	}

	private getNodeEnv(): string {
		try {
			return process.env.NODE_ENV || 'development';
		} catch (error) {
			return 'development';
		}
	}

	private validateConfig() {
		const requiredEnvVars = [
			'DB_HOST',
			'DB_USER',
			'DB_PASSWORD',
			'DB_PORT',
			'DB_NAME'
		];

		const missingVars = requiredEnvVars.filter(
			(envVar) => !process.env[envVar]
		);

		if (missingVars.length > 0) {
			console.error('❌ Missing required environment variables:');
			missingVars.forEach((envVar) => {
				console.error(`   - ${envVar}`);
			});
			console.error(
				'\nPlease check your .env file and ensure all required variables are set.'
			);

			if (
				this.getNodeEnv() === 'production' ||
				this.getNodeEnv() === 'docker'
			) {
				process.exit(1);
			}
		}
	}

	public static getInstance(): Config {
		if (!Config.instance) {
			Config.instance = new Config();
		}
		return Config.instance;
	}

	public get(): any {
		return this.config;
	}
}

// Export a frozen config object
export const config = Object.freeze(Config.getInstance().get());
