import cron from 'node-cron';

import { Logger } from '@/lib/logger';
import { saveMoneyFlowToMongo } from '../../modules/moneyLog/index';
import { cache } from '@/data/cache/cache.service';
import { Key } from '@/data/cache/keys';

const logger = new Logger('DailyPaymentCron');
export async function offloadAndResetTotalAmount() {
    try {
        const key = Key.DAILYTOTAL;
        const totalAmount = await cache.get<number>(key);

        if (totalAmount !== null && totalAmount > 0) {
            // Offload the total amount to MongoDB
            await saveMoneyFlowToMongo(totalAmount);

            // Reset the Redis key to 0 after offloading
            await cache.set(key, 0);

            logger.debug(
                `Offloaded ${totalAmount} and reset the total amount.`
            );
        } else {
            logger.debug('No total amount to offload.');
        }
    } catch (err) {
        logger.error('Error offloading or resetting total amount:', err);
    }
}

// Schedule the cron job to run at 23:59 every day
export const setupDailyResetJob = () => {
    cron.schedule('59 23 * * *', async () => {
        logger.info('Offloading and resetting total daily amount...');
        await offloadAndResetTotalAmount();
    });
};