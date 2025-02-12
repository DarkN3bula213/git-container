import mongoose, { Document, Schema, model } from 'mongoose';

interface IMigrationDocument extends Document {
	name: string;
	version: string;
	status: 'pending' | 'completed' | 'failed' | 'rolled_back';
	appliedAt: Date;
	logs: string[];
}

const migrationSchema = new Schema<IMigrationDocument>({
	name: {
		type: String,
		required: true,
		unique: true
	},
	appliedAt: {
		type: Date,
		default: Date.now
	},
	status: {
		type: String,
		enum: ['pending', 'completed', 'failed', 'rolled_back'],
		default: 'pending'
	},
	version: {
		type: String,
		required: true
	},
	logs: [
		{
			timestamp: Date,
			operation: String,
			details: mongoose.Schema.Types.Mixed
		}
	]
});

const MigrationModel = model<IMigrationDocument>('Migration', migrationSchema);

export default MigrationModel;
