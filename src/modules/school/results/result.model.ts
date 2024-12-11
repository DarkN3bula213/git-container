// models/result.model.ts
import mongoose, { CallbackError, Schema } from 'mongoose';
import { ISubject, Subject } from '../subjects/subject.model';

// Enum for exam status
export enum ExamStatus {
	COMPLETED = 'COMPLETED', // Normal case, exam taken and graded
	ABSENT = 'ABSENT', // Student didn't appear
	DEFERRED = 'DEFERRED', // Exam postponed for this student
	CANCELLED = 'CANCELLED', // Exam cancelled for this student
	DISQUALIFIED = 'DISQUALIFIED' // Due to malpractice/cheating
}

export type Outcome =
	| 'PASS'
	| 'FAIL'
	| 'ABSENT'
	| 'DEFERRED'
	| 'CANCELLED'
	| 'DISQUALIFIED';

// First, let's properly define the base interfaces
export interface SubjectResultBase {
	subjectId: string;
	subjectCode: string;
	subjectName: string;
	marksSecured: number;
	totalMarks?: number;
	passingMarks?: number;
	grade?: string;
	outcome: Outcome;
	examStatus: ExamStatus;
	remarks?: string;
	components?: {
		theory?: {
			marksSecured: number;
			totalMarks?: number;
			passingMarks?: number;
		};
		practical?: {
			marksSecured: number;
			totalMarks?: number;
			passingMarks?: number;
		};
	};
}

// Methods interface
interface ResultMethods {
	calculateTotals(): void;
	getCompletedSubjects(): SubjectResultBase[];
	calculateGrade(): string;
	canBePublished(): boolean;
}

interface ResultStatics {
	createWithValidation(data: Partial<ResultType>): Promise<ResultType>;
}
// Interface for individual subject result
export interface SubjectResult {
	subjectId: ISubject['_id'];
	subjectCode: string;
	subjectName: string;
	marksSecured: number;
	totalMarks: number;
	passingMarks: number;
	grade: string;
	outcome:
		| 'PASS'
		| 'FAIL'
		| 'ABSENT'
		| 'DEFERRED'
		| 'CANCELLED'
		| 'DISQUALIFIED';
	examStatus: ExamStatus;
	remarks?: string;
	components?: {
		theory?: {
			marksSecured: number;
			totalMarks: number;
			passingMarks: number;
		};
		practical?: {
			marksSecured: number;
			totalMarks: number;
			passingMarks: number;
		};
	};
}

// Main result interface

// Main document interface including methods
interface ResultDocument extends mongoose.Document {
	academicYear: string;
	examType: string;
	examDate: Date;
	classId: mongoose.Types.ObjectId;
	className: string;
	section: string;
	studentId: mongoose.Types.ObjectId;
	registrationNo: string;
	studentName: string;
	invigilatorName: string;
	classTeacherName?: string;
	gradedBy?: string;
	verifiedBy?: string;
	subjects: SubjectResultBase[];
	totalMarks?: number;
	marksSecured?: number;
	percentage?: number;
	grade?: string;
	position?: number;
	examStatus: ExamStatus;
	statusReason?: string;
	isPublished: boolean;
	publishedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	modificationHistory?: {
		modifiedBy: string;
		modifiedAt: Date;
		changes: string;
	}[];
	progress: {
		total: number;
		completed: number;
		percentage: number;
	};
	resultStatus: 'PENDING' | 'IN_PROGRESS' | 'PARTIAL' | 'COMPLETE';
}

export type ResultType = ResultDocument & ResultMethods;
export type ResultModel = mongoose.Model<
	ResultType,
	// eslint-disable-next-line @typescript-eslint/ban-types
	{}, // Query helpers (empty in this case)
	ResultMethods
> &
	ResultStatics;

const resultSchema = new Schema<ResultType, ResultModel>(
	{
		academicYear: {
			type: String,
			required: true,
			index: true
		},

		examType: {
			type: String,
			required: true,
			index: true
		},
		examDate: {
			type: Date,
			required: true
		},
		classId: {
			type: Schema.Types.ObjectId,
			ref: 'Class',
			required: true,
			index: true
		},
		className: {
			type: String,
			required: true,
			index: true
		},
		section: {
			type: String,
			required: true
		},
		studentId: {
			type: Schema.Types.ObjectId,
			ref: 'Student',
			required: true,
			index: true
		},
		registrationNo: {
			type: String,
			required: true,
			index: true
		},
		studentName: {
			type: String,
			required: true
		},

		invigilatorName: {
			type: String,
			required: true
		},
		classTeacherName: {
			type: String
			// required: true
		},
		gradedBy: {
			type: String
			// required: true
		},
		verifiedBy: String,
		subjects: [
			{
				subjectId: {
					type: Schema.Types.ObjectId,
					ref: 'Subject',
					required: true
				},
				subjectCode: {
					type: String,
					required: true
				},
				subjectName: {
					type: String,
					required: true
				},
				marksSecured: {
					type: Number,
					required: true,
					min: 0
				},
				totalMarks: {
					type: Number,
					required: true,
					min: 0
				},
				passingMarks: {
					type: Number,
					required: true,
					min: 0
				},
				grade: {
					type: String,
					required: true
				},
				outcome: {
					type: String,
					enum: [
						'PASS',
						'FAIL',
						'ABSENT',
						'DEFERRED',
						'CANCELLED',
						'DISQUALIFIED'
					],
					required: true
				},
				examStatus: {
					type: String,
					enum: Object.values(ExamStatus),
					required: true,
					validate: {
						validator: function (
							this: ResultType,
							status: ExamStatus
						) {
							// If status is not COMPLETED, statusReason must be provided
							if (
								status !== ExamStatus.COMPLETED &&
								!this.statusReason
							) {
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
					required: function (this: ResultType) {
						return this.examStatus !== ExamStatus.COMPLETED;
					}
				},
				remarks: String,
				components: {
					theory: {
						marksSecured: Number,
						totalMarks: Number,
						passingMarks: Number
					},
					practical: {
						marksSecured: Number,
						totalMarks: Number,
						passingMarks: Number
					}
				}
			}
		],
		totalMarks: {
			type: Number
		},
		marksSecured: {
			type: Number
		},
		percentage: {
			type: Number
		},
		grade: {
			type: String
		},
		position: Number,

		isPublished: {
			type: Boolean,
			default: false
		},
		publishedAt: Date,
		modificationHistory: [
			{
				modifiedBy: String,
				modifiedAt: Date,
				changes: String
			}
		]
	},
	{
		timestamps: true,
		virtuals: true
	}
);

// Pre-save middleware to validate subjects against class curriculum
resultSchema.pre('save', async function (next) {
	try {
		// Get all valid subjects for this class
		const validSubjects = await Subject.find({
			classId: this.classId,
			isActive: true
		}).lean();

		// Create maps for quick lookup
		const validSubjectMap = new Map(
			validSubjects.map((subject) => [subject._id.toString(), subject])
		);
		const validSubjectCodes = new Set(
			validSubjects.map((subject) => subject.code)
		);

		// Check each subject in the result
		for (const subject of this.subjects) {
			const validSubject = validSubjectMap.get(
				subject.subjectId.toString()
			);

			if (!validSubject) {
				throw new Error(
					`Invalid subject ID ${subject.subjectId} for class ${this.className}`
				);
			}

			if (!validSubjectCodes.has(subject.subjectCode)) {
				throw new Error(
					`Invalid subject code ${subject.subjectCode} for class ${this.className}`
				);
			}

			if (validSubject.label !== subject.subjectName) {
				throw new Error(
					`Subject name mismatch: ${subject.subjectName} should be ${validSubject.label}`
				);
			}
		}

		next();
	} catch (error) {
		next(error as CallbackError);
	}
});

// Optional: Add a static method for easier result creation with validation
resultSchema.static(
	'createWithValidation',
	async function (
		this: ResultModel,
		resultData: Partial<ResultType>
	): Promise<ResultType> {
		// First validate the subjects
		const validSubjects = await Subject.find({
			classId: resultData.classId,
			isActive: true
		}).lean();

		const validSubjectIds = new Set(
			validSubjects.map((s) => s._id.toString())
		);

		const invalidSubjects = resultData.subjects?.filter(
			(s) => !validSubjectIds.has(s.subjectId.toString())
		);

		if (invalidSubjects?.length) {
			throw new Error(
				`Invalid subjects found for class ${resultData.className}: ${invalidSubjects
					.map((s) => s.subjectName)
					.join(', ')}`
			);
		}

		// Create the result if validation passes
		return new this(resultData);
	}
);

// Add methods to calculate totals
resultSchema.method(
	'getCompletedSubjects',
	function (this: ResultType): SubjectResultBase[] {
		return this.subjects.filter(
			(subject: { examStatus: ExamStatus }) =>
				subject.examStatus === ExamStatus.COMPLETED
		);
	}
);

resultSchema.method('calculateTotals', function (this: ResultType): void {
	const completedSubjects = this.getCompletedSubjects();

	if (completedSubjects.length > 0) {
		this.totalMarks = completedSubjects.reduce(
			(sum: number, subject: SubjectResultBase) =>
				sum + (subject.totalMarks || 0),
			0
		);

		this.marksSecured = completedSubjects.reduce(
			(sum: number, subject: SubjectResultBase) =>
				sum + (subject.marksSecured || 0),
			0
		);

		this.percentage =
			this.totalMarks > 0
				? (this.marksSecured / this.totalMarks) * 100
				: 0;

		this.grade = this.calculateGrade();
	} else {
		// Reset aggregates if no completed subjects
		this.totalMarks = undefined;
		this.marksSecured = undefined;
		this.percentage = undefined;
		this.grade = undefined;
	}
});

// Add middleware to auto-calculate totals before save
resultSchema.pre('save', function (next) {
	this.calculateTotals();
	next();
});

// Add virtual for progress tracking
resultSchema.virtual('progress').get(function () {
	const totalSubjects = this.subjects.length;
	const completedSubjects = this.getCompletedSubjects().length;

	return {
		total: totalSubjects,
		completed: completedSubjects,
		percentage:
			totalSubjects > 0 ? (completedSubjects / totalSubjects) * 100 : 0
	};
});

// Add virtual for result status
resultSchema.virtual('resultStatus').get(function () {
	if (this.subjects.length === 0) return 'PENDING';

	const completedSubjects = this.getCompletedSubjects();
	if (completedSubjects.length === 0) return 'IN_PROGRESS';
	if (completedSubjects.length < this.subjects.length) return 'PARTIAL';

	return 'COMPLETE';
});

// Helper method to calculate grade
resultSchema.method('calculateGrade', function (this: ResultType): string {
	if (!this.percentage) return '';

	// Grade calculation logic
	if (this.percentage >= 90) return 'A+';
	if (this.percentage >= 80) return 'A';
	if (this.percentage >= 70) return 'B+';
	if (this.percentage >= 60) return 'B';
	if (this.percentage >= 50) return 'C';
	if (this.percentage >= 40) return 'D';
	return 'F';
});

// Add method to check if result can be published
resultSchema.method('canBePublished', function (this: ResultType): boolean {
	return (
		this.resultStatus === 'COMPLETE' &&
		!this.subjects.some(
			(s: { examStatus: ExamStatus }) =>
				s.examStatus === ExamStatus.DEFERRED
		)
	);
});
// Indexes for common queries
resultSchema.index({ academicYear: 1, examType: 1, classId: 1 });
resultSchema.index({ studentId: 1, academicYear: 1 });
resultSchema.index({ registrationNo: 1, academicYear: 1 });
resultSchema.index({ classId: 1, examType: 1, examStatus: 1 });
resultSchema.index({ isPublished: 1, publishedAt: 1 });

export const Result = mongoose.model<ResultType, ResultModel>(
	'Result',
	resultSchema
);
