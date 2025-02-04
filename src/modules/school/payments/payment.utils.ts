import { socketService } from '@/index';
import { Logger } from '@/lib/logger';
import { getDayOfYear } from 'date-fns';
import { getNextSequence } from '../counter/counter.model';
import paymentQueue from './payment.queue';

export const getPayId = () => {
	const currentDate = new Date();
	const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
	const currentYear = String(currentDate.getFullYear()).slice(-2);

	return `${currentMonth}${currentYear}`;
};

const logger = new Logger(__filename);
interface JobResult {
	jobId: string;
	success: boolean;
	result?: unknown;
	error?: unknown;
}
interface BatchStatus {
	total: number;
	completed: JobResult[];
	failed: JobResult[];
}

export const batches = new Map<string, BatchStatus>();

export function checkIfBatchCompleted(batchId: string) {
	const batch = batches.get(batchId);
	if (batch && batch.completed.length + batch.failed.length === batch.total) {
		logger.info(`Batch ${batchId} completed. Preparing report...`);
		prepareBatchReport(batchId);
	}
}

export function prepareBatchReport(batchId: string) {
	const batch = batches.get(batchId);
	if (batch) {
		logger.debug({
			event: `Batch report for ${batchId}`,
			successes: batch.completed.length,
			failures: batch.failed.length
		});
		socketService.emit(
			'batchReport',
			JSON.stringify({
				result: {
					id: batchId,
					total: batch.total,
					completed: batch.completed,
					failed: batch.failed
				}
			})
		);
		// Clean up after report
		batches.delete(batchId);
	}
}

export function addJobsToQueue(
	studentIds: string[],
	userId: string,
	batchId: string
) {
	const jobIds = [];
	for (const studentId of studentIds) {
		const jobId = `${batchId}-${studentId}`;
		paymentQueue.add({ studentId, userId }, { jobId });
		jobIds.push(jobId);
	}
	batches.set(batchId, {
		total: studentIds.length,
		completed: [],
		failed: []
	});
}

/** -----------------------------( Serial Number )->
 *
 ** ----------( QRCode )->
 */

export async function generateSerial(
	currentDate: Date = new Date()
): Promise<string> {
	const count = await getNextSequence('invoice');
	const yearCodes = 'HPSN';
	const dayCodes = 'AEFIKLST0';
	const reversedDayCodes = [...dayCodes].reverse().join('');
	const dayOfYear = getDayOfYear(currentDate);

	const yearIndex = Math.floor((dayOfYear - 1) / 100);
	const yearSegment = yearCodes[yearIndex];

	const dayStr = dayOfYear.toString().padStart(2, '0');
	const daySegment1 = dayCodes[parseInt(dayStr[0], 10)];
	const daySegment2 = reversedDayCodes[parseInt(dayStr[1], 10)];

	const checkAlphabet = String.fromCharCode(65 + Math.floor(count / 100));
	const counterSegment = (count % 100).toString().padStart(2, '0');

	return `${yearSegment}${daySegment1}${daySegment2}${checkAlphabet}${counterSegment}`;
}
export function formatBillingCycle(
	payIDs: string[]
): { label: string; value: string }[] {
	return payIDs.map((payID) => {
		const month = payID.slice(0, 2);
		const year = `20${payID.slice(2, 4)}`;
		const startDate = new Date(`${year}-${month}-01`);
		const endDate = new Date(startDate);
		endDate.setMonth(endDate.getMonth() + 1);
		endDate.setDate(0);

		return {
			label: `${startDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleString('default', { month: 'short' })} ${year}`,
			value: payID
		};
	});
}

export const isPayIdGreaterThanCurrent = (payId: string): boolean => {
	const currentPayId = getPayId(); // Get current period's payId

	// Convert both to dates using existing parsePayId utility
	const payIdDate = parsePayId(payId);
	const currentPayIdDate = parsePayId(currentPayId);

	return payIdDate > currentPayIdDate;
};

export function generateClassSectionKey(
	className: string,
	section: string
): string {
	return `${className}-${section}`;
}

export function parsePayId(payId: string): Date {
	const monthStr = payId.slice(0, 2);
	const yearStr = payId.slice(2, 4);
	const month = parseInt(monthStr, 10) - 1; // JavaScript months are 0-based
	const year = 2000 + parseInt(yearStr, 10); // Assuming years are in the 2000s
	return new Date(year, month);
}

export function getBillingMonthDate(payId: string): Date {
	return parsePayId(payId);
}
