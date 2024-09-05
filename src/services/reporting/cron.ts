import cron from 'node-cron';
import { sendDailyPaymentReport } from './daily-fees';
import { Logger } from '@/lib/logger';
const logger = new Logger(__filename);
export const setupCronJobs = () => {
  // Schedule the daily payment report at 11:59 PM
  cron.schedule(
    '59 23 * * *',
    async () => {
      logger.info('Sending daily payment report...');
      try {
        await sendDailyPaymentReport();
        logger.info('Daily payment report sent successfully.');
      } catch (error) {
        logger.error('Error sending daily payment report:', error);
      }
    },
    {
      timezone: 'Asia/Karachi', // Adjust this to your local timezone
    },
  );

  // Schedule the monthly payment report at 11:59 PM on the last day of the month
  logger.info('Setting up monthly payment report cron job...');
};
