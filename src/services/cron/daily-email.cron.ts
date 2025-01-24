// import { config } from '@/lib/config';
import { Logger } from '@/lib/logger';
import cron from 'node-cron';
import { sendPaymentSummaryEmail } from '../mail/mailTrap';

const logger = new Logger(__filename);

// Function to send the payment summary email
export const setupPaymentSummaryJob = () => {
	cron.schedule(
		'59 23 * * *', // Daily at 11:59 PM
		async () => {
			logger.info('Sending daily payment report...');
			try {
				// if (config.production) {
				// 	const date = new Date();
				// 	await sendPaymentSummaryEmail('a.ateeb@proton.me', date);
				// 	logger.info('Daily payment report sent successfully.');
				// } else {
				// 	logger.info(
				// 		'Daily payment report not sent in non-production mode.'
				// 	);
				// }
				const date = new Date();
				await sendPaymentSummaryEmail('a.ateeb@proton.me', date);
			} catch (error) {
				logger.error('Error sending daily payment report:', error);
			}
		},
		{
			timezone: 'Asia/Karachi'
		}
	);
};
