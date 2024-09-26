import { NextFunction, Request, Response } from 'express';
import Joi, { ObjectSchema } from 'joi';
import { Types } from 'mongoose';
import { BadRequestError } from '../api';
import { formatJoiErrorMessage } from '../utils/utils';

export enum ValidationSource {
	BODY = 'body',
	HEADER = 'headers',
	QUERY = 'query',
	PARAM = 'params'
}

export const JoiObjectId = () =>
	Joi.string().custom((value: string, helpers) => {
		if (!Types.ObjectId.isValid(value)) return helpers.error('any.invalid');
		return value;
	}, 'Object Id Validation');

export const JoiUrlEndpoint = () =>
	Joi.string().custom((value: string, helpers) => {
		if (value.includes('://')) return helpers.error('any.invalid');
		return value;
	}, 'Url Endpoint Validation');

export const JoiAuthBearer = () =>
	Joi.string().custom((value: string, helpers) => {
		if (!value.startsWith('Bearer ')) return helpers.error('any.invalid');
		if (!value.split(' ')[1]) return helpers.error('any.invalid');
		return value;
	}, 'Authorization Header Validation');

export const AuthCookie = () =>
	Joi.string().custom((value: string, helpers) => {
		if (!value.startsWith('Bearer ')) return helpers.error('any.invalid');
		if (!value.split(' ')[1]) return helpers.error('any.invalid');
		return value;
	}, 'Authorization Cookie Validation');

export const validate =
	(schema: Joi.AnySchema, source: ValidationSource = ValidationSource.BODY) =>
	(req: Request, _res: Response, next: NextFunction) => {
		try {
			const { error } = schema.validate(req[source]);
			if (!error) return next();
			const { details } = error;
			const message = details
				.map((i) => i.message.replace(/['"]+/g, ''))
				.join(',');
			next(new BadRequestError(message));
		} catch (error) {
			next(error);
		}
	};

interface ValidationSchemas {
	params?: ObjectSchema;
	query?: ObjectSchema;
	body?: ObjectSchema;
}

export const validateReq = (schemas: ValidationSchemas) => {
	return (req: Request, _res: Response, next: NextFunction) => {
		if (schemas.params) {
			const { error: paramsError } = schemas.params.validate(req.params, {
				abortEarly: false
			});
			if (paramsError) {
				const { details } = paramsError;
				const message = formatJoiErrorMessage(details);
				return next(new BadRequestError(message));
			}
		}

		if (schemas.query) {
			const { error: queryError } = schemas.query.validate(req.query, {
				abortEarly: false
			});
			if (queryError) {
				const { details } = queryError;
				const message = formatJoiErrorMessage(details);
				return next(new BadRequestError(message));
			}
		}

		if (schemas.body) {
			const { error: bodyError } = schemas.body.validate(req.body, {
				abortEarly: false
			});
			if (bodyError) {
				const { details } = bodyError;
				const message = formatJoiErrorMessage(details);
				return next(new BadRequestError(message));
			}
		}

		next();
	};
};

export function validateData<T>(schema: Joi.Schema, data: T): T {
	const { error, value } = schema.validate(data, { abortEarly: false });

	if (error) {
		const message = error.details
			.map((i) => i.message.replace(/['"]+/g, ''))
			.join(', ');
		throw new BadRequestError(message);
	}

	return value; // Return the validated data, correctly typed as T
}
