import { withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api';
import { Logger } from '@/lib/logger';
import sendEmail from '@/services/mail';
import { RequestApprovalDetails } from '@/types/mail';
import internalModel from './internal.model';

const logger = new Logger('Internal Service');

class InternalService {
	private static _instance: InternalService;
	constructor(private readonly internal: typeof internalModel) {}
	static getInstance(internal: typeof internalModel) {
		if (!InternalService._instance) {
			InternalService._instance = new InternalService(internal);
		}
		return InternalService._instance;
	}

	public async createApprovalRequest(details: RequestApprovalDetails) {
		return withTransaction(async (session) => {
			// Send email to chairperson
			try {
				await sendEmail({
					to: details.chairpersonEmail,
					subject: `[Action Required] ${details.requestType} Approval Request`,
					templateName: 'approvalRequest',
					templateData: {
						chairpersonName: 'Chairperson HPS',
						requesterName: details.requesterName,
						requesterPosition: details.requesterPosition,
						requestType: details.requestType,
						submissionDate: details.submissionDate,
						department: details.department,
						requestDescription: details.requestDescription,
						additionalDetails: details.additionalDetails || '',
						approveUrl: details.approveUrl,
						rejectUrl: details.rejectUrl,
						portalUrl: details.portalUrl
					}
				});
				logger.info(
					`Request approval email sent to ${details.chairpersonEmail}`
				);
			} catch (error) {
				logger.error(`Error sending request approval email: ${error}`);
				throw new BadRequestError(
					`Failed to send request approval email: ${error}`
				);
			}
			const newRequest = new this.internal(details);
			await newRequest.save({ session });
			return newRequest;
		});
	}

	public async getRequests() {
		return this.internal.find();
	}

	public async updateRequest(id: string, details: RequestApprovalDetails) {
		return this.internal.findByIdAndUpdate(id, details);
	}

	public async deleteRequest(id: string) {
		return this.internal.findByIdAndDelete(id);
	}

	public async getRequestById(id: string) {
		return this.internal.findById(id);
	}
	public async setOutcome(id: string, outcome: 'approved' | 'rejected') {
		return this.internal.findByIdAndUpdate(id, { outcome });
	}
}

const internalService = InternalService.getInstance(internalModel);

export default internalService;
