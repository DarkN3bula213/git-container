import mongoose, { Document, Schema } from 'mongoose';

interface UploadDocument extends Document {
	title: string;
	amount: number;
	vendor?: string;
	date: string;
	filePath: string; // Path to the uploaded file
}

const UploadSchema: Schema = new Schema({
	title: { type: String },
	amount: { type: String },
	vendor: { type: String },
	date: { type: String },
	filePath: { type: String }
});

const Files = mongoose.model<UploadDocument>('Files', UploadSchema);

export default Files;
