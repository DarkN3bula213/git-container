import mongoose from 'mongoose';

export interface IFeedback {
	userId: string;
	message: string;
	attachment: string;
	createdAt: Date;
	updatedAt: Date;
}

const feedbackSchema = new mongoose.Schema<IFeedback>({
	userId: { type: String, required: true },
	message: { type: String, required: true },
	attachment: { type: String, required: false },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IFeedback>('Feedback', feedbackSchema);
