// const { saveSessionQueue } = require('../src/sockets/session.queue');
const { redisClient } = require('../src/data/cache//cache.service');

module.exports = async () => {
	// Close Bull queues

	// Close Redis connections
	if (redisClient) {
		await redisClient.quit();
	}
};
