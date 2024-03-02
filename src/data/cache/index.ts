import { config } from '@/lib/config';
import { Logger as log } from '@/lib/logger';

import { createClient } from 'redis';
const Logger = new log(__filename);

const redisURL = `redis://localhost:6379`;
// const URLFROMCONFIG = `redis://${config.redis.pass}@${config.redis.host}:${config.redis.port}`;

let constr = '';

if (config.isDocker) {
  constr = 'redis://redis:6379';
} else {
  constr = redisURL;
}
// Logger.debug({
//    hardcoded: redisURL ,
//    fromEnv: URLFROMCONFIG ,
//    now: constr ,

// });
const client = createClient({ url: constr });

client.on('connect', () => Logger.info('Cache is connecting'));
client.on('ready', () => Logger.info('Cache is ready'));
client.on('end', () => Logger.info('Cache disconnected'));
client.on('reconnecting', () => Logger.info('Cache is reconnecting'));
client.on('error', (e) => Logger.error(e));

(async () => {
  await client.connect();
})();

// If the Node process ends, close the Cache connection
process.on('SIGINT', async () => {
  await client.disconnect();
});

export default client;
