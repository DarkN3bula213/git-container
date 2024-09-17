import {setupDailyResetJob} from './daily-reset.cron';
import {setupPaymentSummaryJob} from './daily-email.cron';
export const setupCronJobs = () => {
    setupDailyResetJob();
    setupPaymentSummaryJob();
    // Add more jobs as needed
};
