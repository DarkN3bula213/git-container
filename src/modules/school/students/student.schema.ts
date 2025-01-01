import { JoiObjectId, validateReq } from '@/lib/handlers/validate';
import Joi from 'joi';

export const insterOne = Joi.object({
	name: Joi.string().required(),
	className: Joi.string().required(),
	admission_date: Joi.date().required(),
	section: Joi.array().required(),
	fee: Joi.number().required()
});

export const insertMany = Joi.array().items(insterOne);

export const update = Joi.object({
	name: Joi.string().required(),
	className: Joi.string().required(),
	admission_date: Joi.date().required(),
	section: Joi.array().required(),
	fee: Joi.number().required()
});

// Input validation schema
export const studentRegistrationSchema = Joi.object({
	className: Joi.string().required(),
	name: Joi.string().required(),
	age: Joi.number().integer().min(5).required()
	// Add more fields as needed
});

// Output validation schema
export const studentOutputSchema = Joi.object({
	tuition_fee: Joi.number().required(),
	classId: Joi.string().required(),
	section: Joi.string().required(),
	name: Joi.string().required(),
	age: Joi.number().integer().min(5).required()
	// Add more fields as needed
});

export const register = Joi.object({
	//Required fields
	name: Joi.string().required(),
	gender: Joi.string().required(),
	dob: Joi.date().required(),
	className: Joi.string().required(),
	section: Joi.string().required(),
	address: Joi.string().required(),
	father_name: Joi.string().required(),

	father_cnic: Joi.string().min(13).max(13).required(),

	phone: Joi.string().min(11).max(11).required(),

	//Optional fields
	place_of_birth: Joi.string().optional(),
	b_form: Joi.string().optional(),
	cast: Joi.string().optional(),
	father_occupation: Joi.string().optional(),
	religion: Joi.string().optional(),
	registration_no: Joi.string().optional(),
	admission_fee: Joi.number().optional(),
	admission_date: Joi.date().optional(),
	status: Joi.object({
		isActive: Joi.boolean().optional(),
		hasLeft: Joi.boolean().optional(),
		remarks: Joi.array().items(Joi.string().optional()).optional()
	})
});

export const updateFee = Joi.object({
	studentId: JoiObjectId().required(),
	amount: Joi.number().required(),
	remarks: Joi.string().required()
});

export const updateSection = Joi.object({
	id: JoiObjectId().required(),
	section: Joi.string().required()
});

export const student = validateReq({
	params: Joi.object({
		id: JoiObjectId().required()
	})
});

/**
 * studentId, amount, remarks
 */
export const promote = Joi.object({
	studentIds: Joi.array().items(JoiObjectId()).required(),
	targetId: JoiObjectId().required(),
	section: Joi.string().required()
});

export const rollback = Joi.object({
	studentIds: Joi.array().items(JoiObjectId()).required()
});
