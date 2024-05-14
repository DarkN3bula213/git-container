import Joi from 'joi';

// Joi schema for Teacher
export const teacherSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  gender: Joi.string().required(),
  fathers_name: Joi.string().required(),
  address: Joi.string().required(),
  cnic: Joi.string().required(),
  phone: Joi.string().required(),
  dob: Joi.date().required(),
  qualification: Joi.string().required(),
  yearOfGraduation: Joi.date().required(),
  marksObtained: Joi.string().required(),
  boardOrUniversity: Joi.string().required(),
  designation: Joi.string().required(),
  joining_date: Joi.date().required(),
  appointed_by: Joi.string().required(),
  package: Joi.string().required(),
});

export const fetchTeacherParamsSchema = Joi.object({
  cnic: Joi.string()
    .required()
    .regex(/^\d{5}-\d{7}-\d{1}$/),
});
