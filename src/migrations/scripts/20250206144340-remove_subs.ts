import { Logger } from '@/lib/logger';
import { IMigration } from '@/types/migration';
import { removeInvoiceIdFromPaymentModel } from './remove_field';

const logger = new Logger('Remove Subscriptions Migration');

export const remove_subs: IMigration = {
	name: 'remove_subs',
	up: async () => {
		// Implementation
		await removeInvoiceIdFromPaymentModel();
		logger.info('Removed invoiceId from payment model');
	},
	down: async () => {
		// Rollback implementation
	}
};
