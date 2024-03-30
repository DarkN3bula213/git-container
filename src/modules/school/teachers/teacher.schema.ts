import Joi from 'joi';

// Joi schema for Qualification
export const qualificationSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.string().required(),
  institution: Joi.string().required(),
  marks: Joi.string().optional(),
});

// Joi schema for Appointment
export const appointmentSchema = Joi.object({
  designation: Joi.string().required(),
  date: Joi.date().required(),
  appointingAuthority: Joi.string().required(),
  salary: Joi.number().required(),
});

// Joi schema for Teacher
export const teacherSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  gender: Joi.string().required(),
  fatherName: Joi.string().required(),
  address: Joi.string().required(),
  cnic: Joi.string()
    .required()
    .regex(/^\d{5}-\d{7}-\d{1}$/),
  phone: Joi.string()
    .required()
    .regex(/^[0-9]{4}-[0-9]{7}$/),
  dob: Joi.date().required(),
  qualification: Joi.array().items(qualificationSchema).required(),
  appointment: appointmentSchema.required(),
});

export const fetchTeacherParamsSchema = Joi.object({
  cnic: Joi.string()
    .required()
    .regex(/^\d{5}-\d{7}-\d{1}$/),
});

export const updateTeacherBodySchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  // Include other fields as optional for update
  qualification: Joi.array().items(qualificationSchema).optional(),
  appointment: appointmentSchema.optional(),
  // Add more fields as needed
});

export const updateTeacherParamsSchema = Joi.object({
  cnic: Joi.string()
    .required()
    .regex(/^\d{5}-\d{7}-\d{1}$/),
});
