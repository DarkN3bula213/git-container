// models/Result.ts
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

export interface IResult extends Document {
	studentId: Types.ObjectId;
	classId: Types.ObjectId;
	examType: ExamType;
	academicYear: string; // e.g. 2024-2025
	examDate: Date;
	subjects: {
		subjectId: Types.ObjectId;
		marksSecured?: number;
		maxMarks?: number;
		components?: {
			name: string;
			marksSecured: number;
		}[];
		examStatus: ExamStatus;
		statusReason?: string;
		remarks?: string;
	}[];
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
		examType: { type: String, enum: ExamType, required: true },
		academicYear: { type: String, required: true },
		examDate: { type: Date, required: true },
		subjects: [
			{
				subjectId: {
					type: Schema.Types.ObjectId,
					ref: 'Subject',
					required: true
				},
				marksSecured: { type: Number, min: 0 },
				maxMarks: {
					type: Number,
					required: true,
					validate: {
						validator: function (
							this: IResult['subjects'][number],
							value: number
						) {
							return (
								value > 0 &&
								(!this.marksSecured ||
									value >= this.marksSecured)
							);
						},
						message:
							'Max marks must be greater than 0 and greater than or equal to marks secured'
					}
				},
				components: [
					{
						name: { type: String, required: true },
						marksSecured: { type: Number, required: true, min: 0 }
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
				remarks: String
			}
		],
		isPublished: { type: Boolean, default: false }
	},
	{ timestamps: true, versionKey: false }
);

// Indexes for optimized querying
resultSchema.index({ studentId: 1, examType: 1 });
resultSchema.index({ classId: 1, examType: 1, isPublished: 1 });

export const Result = mongoose.model<IResult>('Result', resultSchema);
