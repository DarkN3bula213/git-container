import Joi from "joi";



export default {
    register: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
    }),
    login: Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
    }),
}