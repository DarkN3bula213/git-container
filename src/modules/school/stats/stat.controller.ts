import { cache } from '@/data/cache/cache.service';
import { Key } from '@/data/cache/keys';
import { BadRequestError, SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { ProductionLogger } from '@/lib/logger/v1/logger';
import {
	generateMonthlyFeeStatusEmail,
	getMonthlyFeeStatus
} from '@/services/cron/monthly-student-status';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import paymentModel from '../payments/payment.model';
import { Student } from '../students/student.interface';
import StudentModel from '../students/student.model';
import { getSchoolStatisticsForBillingCycle } from './stat.aggregations';

const logger = new ProductionLogger(__filename);

export const getSchoolStatsBySession = asyncHandler(async (req, res) => {
	const { payId } = req.params;
	// const key = getDynamicKey(DynamicKey.FEE, payId);
	const cachedStats: string[] =
		await getSchoolStatisticsForBillingCycle(payId);
	if (!cachedStats) throw new BadRequestError('Stats not found');
	return new SuccessResponse('Stats fetched successfully', cachedStats).send(
		res
	);
});

export const getUnpaidStudentsList = asyncHandler(async (req, res) => {
	const { payId } = req.params;

	const unpaidStudents = (await StudentModel.find({
		_id: {
			$nin: await paymentModel.distinct('studentId', { payId: payId })
		}
	})) as Student[];
	return new SuccessResponse(
		'Stats fetched successfully',
		unpaidStudents
	).send(res);
});
export const getTodaysCollection = asyncHandler(async (_req, res) => {
	const key = Key.DAILYTOTAL;
	const totalAmount = await cache.get<number>(key);

	if (!totalAmount || totalAmount === 0) {
		return new SuccessResponse('Stats fetched successfully', 0).send(res);
	} else {
		return new SuccessResponse(
			'Stats fetched successfully',
			totalAmount
		).send(res);
	}
});
/**
 *  Month to Date Revenue
                      Last Month Revenue
                      This month week 1 2 3 4
                      Last month week 1 2 3 4
                      Change in student strength
                    Last month collection target real
                    This month collection target achieved
 */

// eslint-disable-next-line no-unused-vars
export const keyMetrics = asyncHandler(async (_req, _res) => {
	// const today = new Date();
	// const startOfBillingCycle = startOfMonth(today);
	// // previous month
	// const previousMonth = subMonths(today, 1);
	// const startOfPreviousMonth = startOfMonth(previousMonth);
	//Month to Date Revenue can be calculated by sum of all payments from start of previous month to start of current month
	// const monthToDateRevenue = await paymentModel.aggregate([
	// 	{
	// 		$match: {
	// 			paymentDate: {
	// 				$gte: startOfPreviousMonth,
	// 				$lte: startOfBillingCycle
	// 			}
	// 		}
	// 	},
	// 	{
	// 		$group: {
	// 			_id: null,
	// 			totalAmount: { $sum: '$amount' }
	// 		}
	// 	}
	// ]);
	// const lastMonthRevenue = await paymentModel.aggregate([
	// 	{
	// 		$match: {
	// 			paymentDate: {
	// 				$gte: startOfPreviousMonth,
	// 				$lte: startOfBillingCycle
	// 			}
	// 		}
	// 	},
	// 	{
	// 		$group: {
	// 			_id: null,
	// 			totalAmount: { $sum: '$amount' }
	// 		}
	// 	}
	// ]);
	// const thisMonthWeek1 = await paymentModel.aggregate([
	// 	{
	// 		$match: {
	// 			paymentDate: {
	// 				$gte: startOfBillingCycle,
	// 				$lte: startOfBillingCycle
	// 			}
	// 		}
	// 	},
	// 	{
	// 		$group: {
	// 			_id: null,
	// 			totalAmount: { $sum: '$amount' }
	// 		}
	// 	}
	// ]);
});

export const getMonthlyStatus = asyncHandler(async (req, res) => {
	const dateStr = req.query.date as string;
	const date = dateStr ? new Date(dateStr) : new Date();

	if (isNaN(date.getTime())) {
		throw new BadRequestError(
			'Invalid date format. Please use ISO date string'
		);
	}

	const feeStatus = await getMonthlyFeeStatus(date);

	const emailHtml = await generateMonthlyFeeStatusEmail(date);
	const previewPath = join(process.cwd(), 'temp', 'fee-status-previews');
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const fileName = `fee-status-${date.toISOString().slice(0, 7)}-preview-${timestamp}.html`;
	const fullPath = join(previewPath, fileName);

	safeWriteFileSync(fullPath, emailHtml);
	logger.info(`Preview saved to: ${fullPath}`);

	const response = {
		date: date.toISOString(),

		data: feeStatus
	};

	return new SuccessResponse('Monthly Records', response).send(res);
});
function ensureDirectoryExists(dirPath: string): void {
	if (!existsSync(dirPath)) {
		try {
			mkdirSync(dirPath, { recursive: true });
			logger.info(`Created directory: ${dirPath}`);
		} catch (error) {
			logger.error(`Error creating directory: ${dirPath}`, error);
			throw new Error(`Failed to create directory: ${dirPath}`);
		}
	}
}

function safeWriteFileSync(filePath: string, content: string): void {
	try {
		// Ensure the directory exists
		const dirPath = join(filePath, '..');
		ensureDirectoryExists(dirPath);

		// Write the file
		writeFileSync(filePath, content);
		logger.info(`File written successfully: ${filePath}`);
	} catch (error) {
		logger.error(`Error writing file: ${filePath}`, error);
		throw new Error(`Failed to write file: ${filePath}`);
	}
}
