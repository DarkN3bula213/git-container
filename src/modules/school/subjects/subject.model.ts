// models/Subject.ts
import { ValidClassName } from '@/lib/constants/classOrder';
import mongoose, { Document, Schema } from 'mongoose';
import { IClass } from '../classes/class.model';

export interface ISubject extends Document {
	code: string;
	label: string;
	type: SubjectType;
	className: ValidClassName;
	orderIndex: number; // For maintaining display order
	hasComponents: boolean; // For subjects like English A/B
	componentGroup?: string; // e.g., 'ENGLISH_7' for 7th grade English A/B
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	classId: IClass['_id'];
}

export const SubjectTypes = [
	'LANGUAGE',
	'MATHEMATICS',
	'SCIENCE',
	'RELIGIOUS',
	'SOCIAL',
	'COMPUTER',
	'ARTS',
	'GENERAL'
] as const;

export type SubjectType = (typeof SubjectTypes)[number];

const subjectSchema = new Schema<ISubject>(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			trim: true,
			minlength: 5,
			maxlength: 5
		},
		label: {
			type: String,
			required: true,
			trim: true
		},
		type: {
			type: String,
			required: true,
			enum: SubjectTypes
		},
		classId: {
			type: Schema.Types.ObjectId,
			ref: 'Class',
			required: true
		},
		className: {
			type: String,
			required: true,
			enum: [
				'Nursery',
				'Prep',
				'1st',
				'2nd',
				'3rd',
				'4th',
				'5th',
				'6th',
				'7th',
				'8th',
				'9th',
				'10th'
			]
		},
		orderIndex: {
			type: Number,
			required: true
		},
		hasComponents: {
			type: Boolean,
			default: false
		},
		componentGroup: {
			type: String,
			sparse: true
		},
		isActive: {
			type: Boolean,
			default: true
		}
	},
	{
		timestamps: true
	}
);

// Compound index for efficient querying
subjectSchema.index({ className: 1, orderIndex: 1 });
subjectSchema.index({ type: 1, className: 1 });
subjectSchema.index({ componentGroup: 1 }, { sparse: true });
subjectSchema.index({ classId: 1, orderIndex: 1 });

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
