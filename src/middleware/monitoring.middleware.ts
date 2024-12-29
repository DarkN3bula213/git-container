import { Application, NextFunction, Request, Response } from 'express';
import { metrics } from '../services/metrics';

export const monitoringMiddleware = () => {
	return (req: Request, res: Response, next: NextFunction) => {
		const start = process.hrtime();

		// Record response
		res.on('finish', () => {
			const duration = process.hrtime(start);
			const durationInSeconds = duration[0] + duration[1] / 1e9;

			// Record metrics
			metrics.httpRequestDuration.observe(
				{
					method: req.method,
					route: req.route?.path || req.path,
					status_code: res.statusCode
				},
				durationInSeconds
			);

			metrics.httpRequestsTotal.inc({
				method: req.method,
				route: req.route?.path || req.path,
				status_code: res.statusCode
			});
		});

		next();
	};
};

export default async function setupMonitoring(app: Application) {
	app.use(monitoringMiddleware());
	app.get('/metrics', async (_req, res) => {
		res.set('Content-Type', metrics.registry.contentType);
		res.end(await metrics.registry.metrics());
	});
}
