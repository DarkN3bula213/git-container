import Joi from 'joi';

export default {
  addEvent: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional(),
    startTime: Joi.date().required(),
    endTime: Joi.date().required(),
    location: Joi.string().required(),
    attendees: Joi.array().items(Joi.string()).optional(),
  }),
  fetchEventParams: Joi.object({
    id: Joi.string().required(),
  }),
  eventParams: Joi.object({
    id: Joi.string().required(),
  }),
};
