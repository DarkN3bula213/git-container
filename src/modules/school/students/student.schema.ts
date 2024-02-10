import Joi from "joi";



export const insterOne = Joi.object({
    name: Joi.string().required(),
    className: Joi.string().required(),
    admission_date: Joi.date().required(),
    section: Joi.array().required(),
    fee: Joi.number().required(),
})


export const insertMany = Joi.array().items(insterOne)

export const update = Joi.object({
    name: Joi.string().required(),
    className: Joi.string().required(),
    admission_date: Joi.date().required(),
    section: Joi.array().required(),
    fee: Joi.number().required(),
})