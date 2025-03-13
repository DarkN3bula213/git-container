export interface RequestApprovalDetails {
	chairpersonEmail: string;
	requesterName: string;
	requesterPosition: string;
	requestType: string;
	submissionDate: string;
	department: string;
	requestDescription: string;
	additionalDetails?: string;
	approveUrl: string;
	rejectUrl: string;
	portalUrl: string;
}
