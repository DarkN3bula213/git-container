import { Logger as log } from '@/lib/logger';
import { generateUniqueRollNumber } from '@/services/generators/roll.generator';
import { type Model, Schema, Types, model } from 'mongoose';
import ClassModel from '../classes/class.model';
import { IClass } from '../classes/interfaces';
import paymentModel from '../payments/payment.model';
import type { Student, StudentDocument } from './student.interface';

const Logger = new log(__filename);

// Define static methods separately
interface IStudentStaticMethods {
	getClassIdByName(className: string): Promise<Types.ObjectId>;
}

// Combine the model with static methods for the full interface
interface IStudentModel extends Model<Student>, IStudentStaticMethods {
	getClassIdByName(className: string): Promise<Types.ObjectId>;
	insertManyWithId(docs: Student[]): Promise<Types.ObjectId[]>;
}
const documentSchema = new Schema<StudentDocument>({
	fileName: {
		type: String,
		required: true
	},
	originalName: {
		type: String,
		required: true
	},
	fileType: {
		type: String,
		required: true
	},
	filePath: {
		type: String,
		required: true
	},
	fileSize: {
		type: Number,
		required: true
	},
	uploadDate: {
		type: Date,
		default: Date.now
	},
	documentType: {
		type: String,
		enum: ['id', 'certificate', 'photo', 'other'],
		default: 'other'
	},
	description: String
});
const studentSchema = new Schema<Student>(
	{
		name: {
			type: String,
			required: [true, 'Name is required'],
			trim: true,
			minlength: [3, 'Name must be at least 3 characters long'],
			maxlength: [100, 'Name must not exceed 100 characters']
		},
		gender: {
			type: String,
			required: [true, 'Gender is required'],
			enum: ['male', 'female']
		},
		dob: {
			type: Date,
			required: [true, 'Date of birth is required']
		},
		place_of_birth: {
			type: String
		},
		b_form: {
			type: String,
			required: [true, 'Form B is required']
		},
		father_name: {
			type: String,
			required: [true, 'Father name is required']
		},
		father_occupation: {
			type: String,
			required: [true, 'Father occupation is required']
		},
		father_cnic: {
			type: String,
			required: [true, 'Father CNIC is required'],
			minlength: [13, 'Father CNIC must be 13 digits long'],
			maxlength: [13, 'Father CNIC must be 13 digits long']
		},
		address: {
			type: String,
			required: [true, 'Address is required']
		},
		cast: {
			type: String,
			required: false
		},
		religion: {
			type: String,
			required: false
		},
		phone: {
			type: String,
			// required: [true, 'Phone number is required'],
			minlength: [11, 'Phone number must be 11 digits long'],
			maxlength: [11, 'Phone number must be 11 digits long']
		},
		registration_no: {
			type: String,
			unique: true
		},
		classId: {
			type: Schema.Types.ObjectId,
			ref: ClassModel,
			required: [true, 'Class is required']
		},
		className: {
			type: String,
			required: [true, 'Class name is required'],
			trim: true,
			minlength: [3, 'Class name must be at least 3 characters long'],
			enum: [
				'Prep',
				'Nursery',
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
		section: {
			type: String,
			required: [true, 'Section is required'],
			trim: true,
			maxlength: [1, 'Section must be at least 1 character long'],
			enum: ['A', 'B', 'C', 'D', 'E']
		},
		feeType: {
			type: String,
			default: 'Full',
			trim: true,

			enum: ['Full', 'Half', 'Free']
		},
		admission_fee: {
			type: Number,
			trim: true
		},
		tuition_fee: {
			type: Number,
			trim: true
		},
		session: {
			type: String
		},
		admission_date: {
			type: Date,

			default: Date.now
		},
		version: { type: Number, default: 1 },
		status: {
			isActive: Boolean,
			hasLeft: Boolean,
			isSpecialCondition: Boolean,
			remarks: [String],
			isDeleted: Boolean
		},
		documents: [documentSchema],
		paymentHistory: [
			{
				paymentId: {
					type: Schema.Types.ObjectId,
					ref: paymentModel.modelName
				},
				payID: String,
				payId: String,
				feeId: {
					type: String
				}
			}
		],
		promotionHistory: [
			{
				previousClassId: String,
				previousClassName: String,
				previousSection: String,
				newClassId: String,
				newClassName: String,
				newSection: String,
				promotionDate: Date,
				oldTuitionFee: Number,
				newTuitionFee: Number
			}
		]
	},

	{
		timestamps: true,
		versionKey: 'version',
		statics: {
			async insertManyWithId(docs: Student[]) {
				const documentsWithIds = await Promise.all(
					docs.map(async (student) => {
						const classDoc = await ClassModel.findOne({
							className: student.className
						});
						if (!classDoc) {
							throw new Error(
								`Invalid class name provided: ${student.className}`
							);
						}
						if (!classDoc.section.includes(student.section)) {
							throw new Error(
								`Invalid section provided: ${student.section}`
							);
						}

						student.classId = classDoc._id;
						student.tuition_fee = classDoc.fee;
						student.registration_no =
							await generateUniqueRollNumber();
						return student;
					})
				);
				return this.insertMany(documentsWithIds);
			}
		}
	}
);

// Define a static method on the studentSchema
studentSchema.statics.bulkInsert = async function (students) {
	for (const student of students) {
		const classDoc = (await ClassModel.findOne({
			className: student.className
		})) as IClass;
		if (!classDoc) {
			throw new Error(
				`Invalid class name provided: ${student.className}`
			);
		}
		if (!classDoc.section.includes(student.section)) {
			throw new Error(`Invalid section provided: ${student.section}`);
		}
		student.classId = classDoc._id;
		student.tuition_fee = classDoc.fee;
		student.registration_no = await generateUniqueRollNumber();
	}
	// Once the additional operations or validations are done, you can use insertMany to perform the bulk insert

	return this.insertMany(students);
};
// studentSchema.pre('save', async function (next) {
// 	if (this.isNew) {
// 		this.registration_no = await generateUniqueId();
// 	}
// 	next(); // Call next to pass control to the next middleware
// });
studentSchema.pre('save', async function (next) {
	try {
		// Only generate registration_no if this is a new document and doesn't already have one
		if (this.isNew && !this.registration_no) {
			// Get the session from the document if it exists
			let session;
			try {
				session = this.$session();
				// Check if session is valid and active
				if (session && !session.hasEnded) {
					this.registration_no =
						await generateUniqueRollNumber(session);
				} else {
					// If no valid session, generate without one
					this.registration_no = await generateUniqueRollNumber();
				}
			} catch (sessionError) {
				const error = sessionError as Error;
				// If there's an error accessing the session, generate without one
				Logger.warn(`Error accessing session: ${error.message}`);
				this.registration_no = await generateUniqueRollNumber();
			}
		}
		next();
	} catch (error: any) {
		Logger.error(`Error generating registration number: ${error.message}`);
		next(error);
	}
});
studentSchema.pre('save', async function (next) {
	try {
		const populatedStudent = await ClassModel.findOne({
			className: this.className
		});
		if (!populatedStudent) {
			throw new Error('Invalid classId provided');
		}
		const classSections = populatedStudent?.section;
		if (!classSections.includes(this.section)) {
			throw new Error(
				`Section ${this.section} does not exist for the specified class`
			);
		}
		this.className = populatedStudent.className;
		this.tuition_fee = populatedStudent.fee;

		next();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		Logger.error(`Error in student model: ${error}`);
		next(error);
	}
});

const getClassIdByName: IStudentStaticMethods['getClassIdByName'] = async (
	className
) => {
	const classDoc = await ClassModel.findOne({ className }).exec();
	if (!classDoc) {
		throw new Error(`Class with name ${className} not found`);
	}
	return classDoc._id as Types.ObjectId;
};

// Attach the static method to the schema
studentSchema.statics.getClassIdByName = getClassIdByName;

// Add these indexes before creating the model
studentSchema.index({ registration_no: 1 }, { unique: true }); // Already exists
studentSchema.index({ name: 1 }); // For student name searches
studentSchema.index({ classId: 1, section: 1 }); // For finding students by class and section
studentSchema.index({ classId: 1 }); // For finding students by className and section
studentSchema.index({ father_cnic: 1 }); // For searching by father's CNIC
studentSchema.index({ 'status.isActive': 1 }); // For querying active/inactive students
// For class/section based filtering
studentSchema.index({ className: 1, section: 1, name: 1 });
// For admission date based calculations
studentSchema.index({ admission_date: 1 });
const StudentModel = model<Student, IStudentModel>('Student', studentSchema);
export default StudentModel;
