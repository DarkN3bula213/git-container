import { convertToObjectId, withTransaction } from '@/data/database/db.utils';
import { BadRequestError } from '@/lib/api';
import { Logger } from '@/lib/logger';
import ClassModel from '@/modules/school/classes/class.model';
import { Student } from '../student.interface';
import StudentModel from '../student.model';

const logger = new Logger(__filename);
class AdmissionService {
	private static instance: AdmissionService;
	constructor(
		private readonly student: typeof StudentModel,
		private readonly classModel: typeof ClassModel
	) {}

	static getInstance() {
		if (!AdmissionService.instance) {
			AdmissionService.instance = new AdmissionService(
				StudentModel,
				ClassModel
			);
		}
		return AdmissionService.instance;
	}

	public async createNewAdmission(
		data: Partial<Student>,
		classId: string,
		section: string
	) {
		return withTransaction(async (session) => {
			const classOId = convertToObjectId(classId);
			const classData = await this.classModel
				.findById(classOId)
				.session(session);
			if (!classData) {
				throw new BadRequestError('Class not found');
			}

			/*<!-- 1. Check for existing registration number if provided -->*/
			if (data.registration_no) {
				const existingByRegNo = await this.student
					.findOne({ registration_no: data.registration_no.trim() })
					.session(session);

				if (existingByRegNo) {
					throw new BadRequestError(
						'Student with this registration number already exists'
					);
				}
			}

			/*<!-- 2. Check for potential duplicates using multiple criteria -->*/
			const duplicateQuery: any = {
				$and: [
					{
						name: {
							$regex: new RegExp(`^${data.name?.trim()}$`, 'i')
						}
					}, // Case-insensitive exact match
					{ dob: data.dob }
				]
			};

			/*<!-- 3. Add father's name if available for more precise matching -->*/
			if (data.father_name) {
				duplicateQuery.$and.push({
					father_name: {
						$regex: new RegExp(`^${data.father_name?.trim()}$`, 'i')
					}
				});
			}

			/*<!-- 4. Add B-form number if available (this should be unique per student) -->*/
			if (data.b_form) {
				duplicateQuery.$and.push({ b_form: data.b_form.trim() });
			}

			const potentialDuplicate = await this.student
				.findOne(duplicateQuery)
				.session(session);

			if (potentialDuplicate) {
				throw new BadRequestError(
					'A student with the same name and date of birth already exists. ' +
						'This might be a duplicate entry.'
				);
			}

			/*<!-- 5. Check for B-form uniqueness if provided (should be unique per student) -->*/
			if (data.b_form) {
				const existingByBForm = await this.student
					.findOne({ b_form: data.b_form.trim() })
					.session(session);

				if (existingByBForm) {
					throw new BadRequestError(
						'Student with this B-form number already exists'
					);
				}
			}

			/*<!-- 6. Check for CNIC uniqueness if provided (multiple siblings might share father's CNIC) -->*/
			/*<!-- This is a soft check that might generate a warning rather than an error -->*/
			if (data.father_cnic) {
				const existingByCNIC = await this.student
					.findOne({ father_cnic: data.father_cnic.trim() })
					.session(session);

				if (existingByCNIC) {
					/*<!-- This is just a warning log, not an error -->*/
					logger.warn(
						`New student has same father CNIC as existing student: ${existingByCNIC.name}`
					);
				}
			}

			const student = new this.student({
				/*<!----- Personal Information ----->*/
				name: data.name?.trim(),
				gender: data.gender?.trim(),
				dob: data.dob,
				place_of_birth: data.place_of_birth?.trim(),
				b_form: data.b_form?.trim(),

				/*<!----- Guardian Information ----->*/
				father_name: data.father_name?.trim(),
				father_cnic: data.father_cnic?.trim(),
				father_occupation: data.father_occupation?.trim(),
				religion: data.religion?.trim(),
				address: data.address?.trim(),
				cast: data.cast?.trim(),
				phone: data.phone?.trim(),

				/*<!----- School Information ----->*/
				registration_no: data.registration_no?.trim(),
				classId: classOId,
				className: classData.className,
				section: section,
				tuition_fee: classData.fee,

				/*<!----- Financial Information ----->*/
				admission_fee: data.admission_fee,
				feeType: data.feeType,
				session: data.session || '2025-2026',
				admission_date: data.admission_date || new Date(),

				/*<!----- Status ----->*/
				status: {
					isActive: true,
					hasLeft: false,
					remarks: []
				}
			});

			const savedStudent = await student.save({ session });
			return savedStudent;
		});
	}
}

export const admissionService = AdmissionService.getInstance();
