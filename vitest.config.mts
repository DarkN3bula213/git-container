import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';


export default defineConfig({
	plugins: [tsconfigPaths()],

	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['./tests/setup.ts'],
		testTimeout: 30000,
		mockReset: true,
		clearMocks: true,
		restoreMocks: true,
		alias: {
			'@': path.resolve(__dirname, './src')
		},
	 
	}
});