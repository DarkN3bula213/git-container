import { Schema, model } from 'mongoose';

interface RequestApproval {
	requesterName: string;
	requesterPosition: string;
	requestType: string;
	submissionDate: string;
	department: string;
	requestDescription: string;
	additionalDetails?: string;
	outcome: 'pending' | 'approved' | 'rejected';
}

const internalModel = new Schema<RequestApproval>({
	requesterName: { type: String, required: true },
	requesterPosition: { type: String, required: true },
	requestType: { type: String, required: true },
	submissionDate: { type: String, required: true },
	department: { type: String, required: true },
	requestDescription: { type: String, required: true },
	additionalDetails: { type: String, required: false },
	outcome: {
		type: String,
		required: true,
		enum: ['pending', 'approved', 'rejected']
	}
});

const InternalModel = model<RequestApproval>('Internal', internalModel);

export default InternalModel;
