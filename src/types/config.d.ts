export interface ConfigType {
	node: string;
	isProduction: boolean;
	isTest: boolean;
	isJest: boolean;
	disengage: string;
	isDocker: boolean;
	isDevelopment: boolean;
	showScope: boolean;
	app: {
		port: number;
		mappedIP: string;
	};
	cors: {
		origin: string;
		credentials: boolean;
		methods: string[];
		allowedHeaders: string[];
		exposedHeaders: string[];
	};
	origin: string;
	urlEncoded: {
		limit: string;
		extended: boolean;
		parameterLimit: number;
	};
	json: {
		limit: string;
	};
	log: {
		level: string;
		directory: string;
		logtail?: {
			token: string | undefined;
			endpoint: string;
		};
	};
	mongo: {
		host: string;
		user: string;
		pass: string;
		port: number;
		database: string;
		pool: {
			min: number;
			max: number;
		};
		uri: string;
		dev: string;
		docker: string;
		url: string;
	};
	redis: {
		host: string;
		user: string;
		pass: string;
		port: number;
		uri: string;
	};
	tokens: {
		jwtSecret: string;
		access: {
			private: string;
			public: string;
			ttl: string;
		};
		refresh: {
			private: string;
			public: string;
			ttl: string;
		};
	};
	cookieOptions: () => {
		httpOnly: boolean;
		secure: boolean;
		sameSite: string;
		maxAge: number;
		domain: string;
	};
	supabase: {
		url: string;
		key: string;
	};
	mail: {
		host: string;
		port: number;
		token: string;
		address: string;
		url: string;
		adminEmail: string;
		auth: {
			user: string;
			pass: string;
		};
		test: {
			inboxId: string;
			token: string;
			adminEmail: string;
		};
		paymentSummarySubject: string;
	};
	cnic: {
		numberOne: string;
		numberTwo: string;
		numberThree: string;
	};
}
