import cron from 'node-cron';
import { Logger } from '@/lib/logger';
import { sendPaymentSummaryEmail } from '../mail/mailTrap';
const logger = new Logger(__filename);
export const setupCronJobs = () => {
    // Schedule the daily payment report at 11:59 PM
    cron.schedule(
        '59 23 * * *',
        async () => {
            logger.info('Sending daily payment report...');
            try {
                const date = new Date(); // This will capture the current date
                await sendPaymentSummaryEmail('a.ateeb@proton.me', date);
                logger.info('Daily payment report sent successfully.');
            } catch (error) {
                logger.error('Error sending daily payment report:', error);
            }
        },
        {
            timezone: 'Asia/Karachi' // Adjust this to your local timezone
        }
    );

    // Schedule the monthly payment report at 11:59 PM on the last day of the month
    logger.info('Setting up monthly payment report cron job...');
};
