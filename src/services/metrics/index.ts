import promClient from 'prom-client';

export class MetricsService {
	private static instance: MetricsService;
	public registry: promClient.Registry;

	// Only declare the metrics
	public httpRequestDuration!: promClient.Histogram;
	public httpRequestsTotal!: promClient.Counter;
	public socketConnectionsTotal!: promClient.Gauge;
	public databaseOperationDuration!: promClient.Histogram;
	public cacheHits!: promClient.Counter;
	public cacheMisses!: promClient.Counter;

	private constructor() {
		this.registry = new promClient.Registry();

		// Initialize default metrics
		promClient.collectDefaultMetrics({ register: this.registry });

		this.initializeMetrics();
	}

	private initializeMetrics(): void {
		// Initialize and register metrics in one go
		this.httpRequestDuration = new promClient.Histogram({
			name: 'http_request_duration_seconds',
			help: 'Duration of HTTP requests in seconds',
			labelNames: ['method', 'route', 'status_code'],
			buckets: [0.1, 0.5, 1, 2, 5],
			registers: [this.registry] // Register directly
		});

		this.httpRequestsTotal = new promClient.Counter({
			name: 'http_requests_total',
			help: 'Total number of HTTP requests',
			labelNames: ['method', 'route', 'status_code'],
			registers: [this.registry]
		});

		this.socketConnectionsTotal = new promClient.Gauge({
			name: 'socket_connections_total',
			help: 'Total number of active socket connections',
			registers: [this.registry]
		});

		this.databaseOperationDuration = new promClient.Histogram({
			name: 'database_operation_duration_seconds',
			help: 'Duration of database operations in seconds',
			labelNames: ['operation', 'collection'],
			buckets: [0.01, 0.05, 0.1, 0.5, 1],
			registers: [this.registry]
		});

		this.cacheHits = new promClient.Counter({
			name: 'cache_hits_total',
			help: 'Total number of cache hits',
			labelNames: ['operation'],
			registers: [this.registry]
		});

		this.cacheMisses = new promClient.Counter({
			name: 'cache_misses_total',
			help: 'Total number of cache misses',
			labelNames: ['operation'],
			registers: [this.registry]
		});
	}

	public static getInstance(): MetricsService {
		if (!MetricsService.instance) {
			MetricsService.instance = new MetricsService();
		}
		return MetricsService.instance;
	}
}

export const metrics = MetricsService.getInstance();
