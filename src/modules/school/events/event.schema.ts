import { validateReq } from '@/lib/handlers/validate';
import Joi from 'joi';
// Custom validation for time in HH:mm format
const timeFormat = Joi.string().pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/);
const eventSchema = Joi.object({
   title: Joi.string().max(100).required(),
   location: Joi.string().max(255).allow(''), // Optional field
   date: Joi.date().greater('now').required(), // Date should be today or in the future
   startTime: timeFormat.required(),
   endTime: timeFormat.required(),
   isAllDay: Joi.boolean().required(),
   description: Joi.string().max(255).allow(''), // Optional field
   participants: Joi.array().items(Joi.string()).optional() // Assuming participants are emails; adjust as necessary
});
export default {
   addEvent: Joi.object({
      title: Joi.string().required(),
      description: Joi.string().optional(),
      startTime: Joi.date().required(),
      endTime: Joi.date().required(),
      location: Joi.string().required(),
      attendees: Joi.array().items(Joi.string()).optional()
   }),
   fetchEventParams: Joi.object({
      id: Joi.string().required()
   }),
   eventParams: Joi.object({
      id: Joi.string().required()
   }),
   createEvent: validateReq({
      body: eventSchema
   })
};
