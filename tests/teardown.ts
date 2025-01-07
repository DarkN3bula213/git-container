// const { saveSessionQueue } = require('../src/sockets/session.queue');
import { cache } from '../src/data/cache/cache.service';

export default async () => {
	// Close Bull queues

	// Close Redis connections
	if (cache) {
		await cache.getClient().quit();
	}
};
