import mongoose, { Document, Schema } from 'mongoose';
import { calculateFileHash } from './file.utils';

interface UploadDocument extends Document {
	title: string;
	amount: number;
	vendor?: string;
	date: string;
	filePath: string; // Path to the uploaded file
	hash: string;
	createdAt: Date;
	updatedAt: Date;
}

const UploadSchema: Schema<UploadDocument> = new Schema(
	{
		title: { type: String },
		amount: { type: Number },
		vendor: { type: String },
		date: { type: String },
		filePath: { type: String },
		hash: { type: String }
	},
	{ timestamps: true, versionKey: false }
);

UploadSchema.pre('save', async function (next) {
	const file = this as UploadDocument;
	const hash = await calculateFileHash(file.filePath);
	file.hash = hash as string;
	next();
});

const Files = mongoose.model<UploadDocument>('Files', UploadSchema);

export default Files;
