import { SuccessResponse } from '@/lib/api';
import asyncHandler from '@/lib/handlers/asyncHandler';
import internalService from './internal.service';

export const createApprovalRequest = asyncHandler(async (req, res) => {
	const {
		chairpersonEmail,
		requesterName,
		requesterPosition,
		requestType,
		submissionDate,
		department,
		requestDescription,
		additionalDetails,
		approveUrl,
		rejectUrl,
		portalUrl
	} = req.body;
	const approvalRequest = await internalService.createApprovalRequest({
		chairpersonEmail,
		requesterName,
		requesterPosition,
		requestType,
		submissionDate,
		department,
		requestDescription,
		additionalDetails,
		approveUrl,
		rejectUrl,
		portalUrl
	});
	new SuccessResponse(
		'Approval request created successfully',
		approvalRequest
	).send(res);
});
