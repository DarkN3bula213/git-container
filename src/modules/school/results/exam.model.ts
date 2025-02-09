// models/Result.ts
import dayjs from 'dayjs';
import mongoose, { Document, Schema, Types } from 'mongoose';

export enum ExamStatus {
	COMPLETED = 'COMPLETED',
	ABSENT = 'ABSENT',
	DEFERRED = 'DEFERRED',
	CANCELLED = 'CANCELLED',
	DISQUALIFIED = 'DISQUALIFIED'
}

export enum ExamType {
	TERM = 'TERM',
	ANNUAL = 'ANNUAL'
}

export type SubjectMarks = {
	code: string;
	title: string;
	obtainedMarks?: number;
	totalMarks?: number;
	examStatus: ExamStatus;
	remarks?: string;
	components?: {
		name: string;
		obtainedMarks: number;
		totalMarks: number;
		examStatus: ExamStatus;
		statusReason?: string;
		remarks?: string;
	}[];
	lastUpdated?: Date;
};

export interface IResult extends Document {
	studentId: Types.ObjectId;
	classId: Types.ObjectId;
	examType: ExamType;
	academicYear: string; // e.g. 2024-2025
	examDate: Date;
	subjects: SubjectMarks[];
	isPublished: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const resultSchema = new Schema<IResult>(
	{
		studentId: {
			type: Schema.Types.ObjectId,
			ref: 'Student',
			required: true
		},
		classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
		examType: { type: String, enum: ExamType, default: ExamType.ANNUAL },
		academicYear: {
			type: String,
			default: dayjs().format('YYYY-MM-DD')
		},
		examDate: { type: Date },
		subjects: [
			{
				code: { type: String, required: true },
				title: { type: String, required: true },
				obtainedMarks: { type: Number, min: 0 },
				totalMarks: {
					type: Number,
					required: true,
					validate: {
						validator: function (
							this: IResult['subjects'][number],
							value: number
						) {
							return (
								value > 0 &&
								(!this.obtainedMarks ||
									value >= this.obtainedMarks)
							);
						},
						message:
							'Max marks must be greater than 0 and greater than or equal to marks secured'
					}
				},
				components: [
					{
						name: { type: String, required: true },
						obtainedMarks: { type: Number, required: true, min: 0 },
						totalMarks: { type: Number, required: true, min: 0 },
						examStatus: {
							type: String,
							enum: ExamStatus,
							default: ExamStatus.COMPLETED
						},
						statusReason: { type: String },
						remarks: { type: String }
					}
				],
				examStatus: {
					type: String,
					enum: ExamStatus,
					default: ExamStatus.COMPLETED,
					validate: {
						validator: function (
							this: IResult,
							status: ExamStatus
						) {
							// If status is not COMPLETED, statusReason must be provided
							if (status !== ExamStatus.COMPLETED) {
								return false;
							}
							return true;
						},
						message:
							'Status reason is required when exam status is not COMPLETED'
					}
				},
				statusReason: {
					type: String,
					required: function (this: IResult['subjects'][number]) {
						return this.examStatus !== ExamStatus.COMPLETED;
					}
				},
				remarks: String,
				lastUpdated: { type: Date, default: Date.now }
			}
		],
		isPublished: { type: Boolean, default: false }
	},
	{ timestamps: true, versionKey: false }
);

// Compound index for unique exam result per student per academic year
resultSchema.index(
	{ studentId: 1, examType: 1, academicYear: 1 },
	{ unique: true }
);

// Index for querying results by class
resultSchema.index({ classId: 1, examType: 1, academicYear: 1 });

// Pre-save middleware to validate subjects
resultSchema.pre('save', function (next) {
	// Ensure no duplicate subject codes
	const subjectCodes = new Set();
	for (const subject of this.subjects) {
		if (subjectCodes.has(subject.code)) {
			next(new Error(`Duplicate subject code found: ${subject.code}`));
			return;
		}
		subjectCodes.add(subject.code);
	}
	next();
});

export default mongoose.model<IResult>('Result', resultSchema);
