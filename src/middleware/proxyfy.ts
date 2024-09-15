import { Logger } from '@/lib/logger';
import type { Application } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const logger = new Logger(__filename);
export const useProxy = (app: Application) => {
    logger.info('Setting up proxy for /api/files');
    app.use(
        '/api/files',

        createProxyMiddleware({
            target: 'http://localhost:5050',
            changeOrigin: true
        })
    );
};
