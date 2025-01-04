module.exports = {
	apps: [
		{
			name: 'hps-api',
			script: './dist/index.js',
			instances: 'max', // or a number like 4
			exec_mode: 'cluster',
			autorestart: true,
			max_memory_restart: '1G',
			env: {
				NODE_ENV: 'production',
				PORT: 3000
			}
		}
	]
};
