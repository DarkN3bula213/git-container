import { Schema, Types, model } from 'mongoose';
import {
	IClass,
	IClassSection,
	IClassSubject,
	IFeeHistory
} from './interfaces';

const classSectionSchema = new Schema<IClassSection>(
	{
		section: {
			type: String,
			enum: ['A', 'B', 'C', 'D', 'E'],
			required: true
		},
		teacherId: {
			type: Schema.Types.ObjectId,
			required: true
		},
		teacherName: {
			type: String,
			required: true
		},
		configuration: {
			type: String,
			enum: ['mixed', 'boys', 'girls'],
			required: true,
			default: 'mixed'
		}
	},
	{
		timestamps: true,
		versionKey: false
	}
);

const classSubjectSchema = new Schema<IClassSubject>(
	{
		name: {
			type: Schema.Types.String,
			required: true // Add required validation
		},
		level: {
			type: Schema.Types.String,
			required: true // Add required validation
		},
		teacherId: {
			type: Schema.Types.ObjectId,
			// ref: 'Teacher',
			required: false
		},
		prescribedBooks: {
			type: [Schema.Types.String],
			required: false
		},
		subjectId: {
			type: Schema.Types.String,
			required: true // Add required validation
		},
		code: {
			type: Schema.Types.String,
			required: false
		},
		teacherName: {
			type: Schema.Types.String,
			required: false
		}
	},
	{
		timestamps: true,
		versionKey: false,
		_id: false
	}
);

const feeHistorySchema = new Schema<IFeeHistory>(
	{
		fee: {
			type: Schema.Types.Number,
			required: true
		},
		effectiveFrom: {
			type: Schema.Types.Date,
			required: true
		},
		reason: {
			type: Schema.Types.String
		},
		updatedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true
		}
	},
	{ _id: false }
);
const schema = new Schema<IClass>(
	{
		className: {
			type: Schema.Types.String,
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
			],
			trim: true,
			unique: true,
			required: true
		},
		section: {
			type: [Schema.Types.String],
			enum: ['A', 'B', 'C', 'D', 'E'],
			required: true
		},
		fee: {
			type: Schema.Types.Number,
			required: true,
			min: 0
		},
		subjects: {
			type: [classSubjectSchema],
			required: false
		},
		sections: {
			type: [classSectionSchema],
			required: false
		},
		classTeacher: {
			type: {
				teacherId: {
					type: Schema.Types.ObjectId,
					ref: 'Teacher'
				},
				teacherName: {
					type: Schema.Types.String
				}
			},
			required: false
		},
		updatedBy: {
			type: {
				userId: {
					type: Schema.Types.ObjectId,
					ref: 'User'
				},
				userName: {
					type: Schema.Types.String
				}
			},
			required: false
		},
		feeHistory: {
			type: [feeHistorySchema],
			required: false
		}
	},
	{
		timestamps: true,
		versionKey: false
	}
);

// Add a pre-save middleware to track fee changes
schema.pre('save', function (next) {
	if (this.isModified('fee')) {
		const currentFee = this.fee;
		const feeHistoryEntry: IFeeHistory = {
			fee: currentFee,
			effectiveFrom: new Date(),
			updatedBy: this.updatedBy?.userId ?? new Types.ObjectId()
		};
		this.feeHistory.push(feeHistoryEntry);
	}
	next();
});
const ClassModel = model<IClass>('Class', schema);

export default ClassModel;
