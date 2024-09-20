import { setupPaymentSummaryJob } from './daily-email.cron';
import { setupDailyResetJob } from './daily-reset.cron';

export const setupCronJobs = () => {
	setupDailyResetJob();
	setupPaymentSummaryJob();
	// Add more jobs as needed
};
