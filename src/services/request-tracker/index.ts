import { CacheClientService } from '@/data/cache/cache.service';
import { ProductionLogger } from '@/lib/logger/v1/logger';
import UserSessionModel, {
	ActivitySummary
} from '@/modules/auth/sessions/session.model';

const logger = new ProductionLogger('RequestTrackerService');

interface RequestLog {
	userId: string;
	path: string;
	method: string;
	statusCode: number;
	timestamp: Date;
}

interface UserRequestSummary {
	total: number;
	byMethod: Record<string, number>;
	byStatus: Record<string, number>;
	byPath: Record<
		string,
		{
			count: number;
			methods: Record<string, number>;
		}
	>;
	lastAccessed: Date;
}

interface DailySummary {
	total: number;
	byUser: Record<string, UserRequestSummary>;
	byMethod: Record<string, number>;
	byStatus: Record<string, number>;
}

export class RequestTrackerService {
	private readonly keyPrefix = 'request_tracker:';

	constructor(private cache: CacheClientService) {}

	private getDateKey(date: string): string {
		return `${this.keyPrefix}logs:${date}`;
	}

	private getSummaryKey(date: string): string {
		return `${this.keyPrefix}summary:${date}`;
	}

	async trackRequest(
		userId: string,
		path: string,
		method: string,
		statusCode: number
	): Promise<void> {
		try {
			const today = new Date().toISOString().split('T')[0];
			const logKey = this.getDateKey(today);
			const summaryKey = this.getSummaryKey(today);

			// Fire and forget - don't await these operations
			this.updateLogs(logKey, {
				userId,
				path,
				method,
				statusCode,
				timestamp: new Date()
			});
			this.updateSummary(summaryKey, userId, path, method, statusCode);
		} catch (error) {
			logger.error(`Error tracking request: ${error}`);
		}
	}

	private async updateLogs(key: string, log: RequestLog): Promise<void> {
		const logs = (await this.cache.get<RequestLog[]>(key)) || [];
		logs.push(log);

		await this.cache.setExp(key, logs, 86400); // 24 hours

		// eslint-disable-next-line no-console
		// console.log(logs);
	}

	private async updateSummary(
		key: string,
		userId: string,
		path: string,
		method: string,
		statusCode: number
	): Promise<void> {
		const summary = (await this.cache.get<DailySummary>(key)) || {
			total: 0,
			byUser: {},
			byMethod: {},
			byStatus: {}
		};

		// Update total counts
		summary.total += 1;
		summary.byMethod[method] = (summary.byMethod[method] || 0) + 1;

		const statusGroup = Math.floor(statusCode / 100) * 100;
		const statusKey = `${statusGroup}-${statusGroup + 99}`;
		summary.byStatus[statusKey] = (summary.byStatus[statusKey] || 0) + 1;

		// Initialize or update user summary
		if (!summary.byUser[userId]) {
			summary.byUser[userId] = {
				total: 0,
				byMethod: {},
				byStatus: {},
				byPath: {},
				lastAccessed: new Date()
			};
		}

		const userSummary = summary.byUser[userId];
		userSummary.total += 1;
		userSummary.lastAccessed = new Date();
		userSummary.byMethod[method] = (userSummary.byMethod[method] || 0) + 1;
		userSummary.byStatus[statusKey] =
			(userSummary.byStatus[statusKey] || 0) + 1;

		// Update path statistics for user
		if (!userSummary.byPath[path]) {
			userSummary.byPath[path] = {
				count: 0,
				methods: {}
			};
		}
		userSummary.byPath[path].count += 1;
		userSummary.byPath[path].methods[method] =
			(userSummary.byPath[path].methods[method] || 0) + 1;

		await this.cache.setExp(key, summary, 86400); // 24 hours

		// eslint-disable-next-line no-console
		// console.log(summary);
	}

	// Method for cron job to handle daily offloading
	async processDailyOffload(): Promise<void> {
		try {
			// Get yesterday's date
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const date = yesterday.toISOString().split('T')[0];

			logger.info(`Starting daily request log offload: ${date}`);

			const [logs, summary] = await Promise.all([
				this.getLogs(date),
				this.getSummary(date)
			]);

			if (logs?.length || summary) {
				// Update user sessions with activity data
				if (summary?.byUser) {
					const userIds = Object.keys(summary.byUser);
					await Promise.all(
						userIds.map(async (userId) => {
							const session = await UserSessionModel.findOne({
								userID: userId,
								startTime: {
									$lte: new Date(`${date}T23:59:59.999Z`)
								},
								endTime: {
									$gte: new Date(`${date}T00:00:00.000Z`)
								}
							});

							if (session) {
								session.activity = {
									total: summary.byUser[userId].total,
									byMethod: summary.byUser[userId].byMethod,
									byStatus: summary.byUser[userId].byStatus,
									resourceAccess: Object.entries(
										summary.byUser[userId].byPath
									)
										.map(([path, data]) => ({
											path,
											count: data.count,
											methods: data.methods,
											lastAccessed:
												summary.byUser[userId]
													.lastAccessed
										}))
										.sort((a, b) => b.count - a.count)
								};
								await session.save();
							}
						})
					);
				}

				// Store in collection 1159
				// await this.storeInDatabase({
				// 	activity: summary,
				// 	date,
				// 	logs,
				// 	summary
				// });

				// Clean up cache after successful offload
				await Promise.all([
					this.cache.del(this.getDateKey(date)),
					this.cache.del(this.getSummaryKey(date))
				]);

				logger.info(`Daily request log offload completed: ${date}`);
			}
		} catch (error) {
			logger.error(
				`Error processing daily request log offload: ${error}`
			);
			throw error; // Let the cron handler deal with the error
		}
	}

	private async storeInDatabase(data: {
		userId: string;
		activity: ActivitySummary;
		date: string;
		logs: RequestLog[] | null;
		summary: DailySummary | null;
	}): Promise<void> {
		// Implement your database storage logic here
		await UserSessionModel.updateOne(
			{ userID: data.userId },
			{ $set: { activity: data.activity } }
		);
		// For example:
		// await db.collection('request_logs_1159').insertOne(data);
	}

	// Existing methods...
	async getUserActivity(
		userId: string,
		date: string
	): Promise<UserRequestSummary | null> {
		const summary = await this.getSummary(date);
		return summary?.byUser[userId] || null;
	}

	async getUserRecentPaths(
		userId: string,
		date: string
	): Promise<
		Array<{ path: string; count: number; methods: Record<string, number> }>
	> {
		const userSummary = await this.getUserActivity(userId, date);
		if (!userSummary) return [];

		return Object.entries(userSummary.byPath)
			.map(([path, data]) => ({
				path,
				count: data.count,
				methods: data.methods
			}))
			.sort((a, b) => b.count - a.count);
	}

	async getSummary(date: string): Promise<DailySummary | null> {
		return await this.cache.get<DailySummary>(this.getSummaryKey(date));
	}

	async getLogs(date: string): Promise<RequestLog[] | null> {
		return await this.cache.get<RequestLog[]>(this.getDateKey(date));
	}

	async getUserLogs(userId: string, date: string): Promise<RequestLog[]> {
		const logs = await this.getLogs(date);
		return logs?.filter((log) => log.userId === userId) || [];
	}
}
