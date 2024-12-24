import type { Application, NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { MulterError } from 'multer';
import {
	ApiError,
	BadRequestError,
	ErrorType,
	InternalError,
	NotFoundError
} from '../api';
import {
	formatDuplicateKeyError,
	handleMongooseError
} from '../api/MongooseError';
import { isDuplicateKeyError } from '../api/MongooseError';
import { config } from '../config';
import { Logger } from '../logger';

const logger = new Logger(__filename);
export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	// eslint-disable-next-line no-unused-vars
	_next: NextFunction
) => {
	let error = { ...err };
	error.message = err.message;

	// Mongoose Error Handling

	// Bad ObjectId
	if (err.name === 'CastError') {
		const message = `Resource not found`;
		error = new NotFoundError(message);
	}

	// if (isDuplicateKeyError(err)) {
	// 	const field = Object.keys(err.keyPattern)[0];
	// 	const value = err.keyValue[field];
	// 	const message = `Duplicate value '${value}' for field '${field}'`;
	// 	error = new BadRequestError(message); // Consider using a more specific error type
	// }
	if (isDuplicateKeyError(err)) {
		// Since we're now doing async operations, we need to handle the error asynchronously
		formatDuplicateKeyError(err)
			.then((message) => {
				const formattedError = new BadRequestError(message);
				ApiError.handle(formattedError, res);
			})
			.catch((formatError) => {
				logger.error(
					'Error formatting duplicate key error:',
					formatError
				);
				const fallbackError = new BadRequestError(
					'A duplicate entry was detected'
				);
				ApiError.handle(fallbackError, res);
			});
		return; // Important: return here since we're handling the response asynchronously
	}
	// Validation Error
	if (err.name === 'ValidationError') {
		const message = Object.values(
			(err as mongoose.Error.ValidationError).errors
		)
			.map(
				(
					val:
						| mongoose.Error.ValidatorError
						| mongoose.Error.CastError
				) => val.message
			)
			.join(', ');
		error = new InternalError(message);
	}
	if (err instanceof ApiError) {
		ApiError.handle(err, res);
		if (err.type === ErrorType.INTERNAL) {
			logger.error({
				'status: ': 500,
				'message: ': err.message,
				'method: ': req.method
			});
		}
	} else if (err instanceof mongoose.Error) {
		handleMongooseError(err, req, res);
	} else if (err instanceof MulterError) {
		const multerError: MulterError = err;
		const statusCode =
			multerError.code === 'LIMIT_UNEXPECTED_FILE' ? 400 : 500;

		logger.error({
			'status: ': statusCode,
			'message: ': err.message,
			'method: ': req.method
		});

		res.status(statusCode).json({ error: err.message });
	} else {
		logger.error(err.message);
		if (config.isDevelopment) {
			return res.status(500).send(err);
		}
		ApiError.handle(new InternalError(), res);
	}
};

export default (app: Application) => {
	app.all('*', (_req, _res, next) => next(new NotFoundError()));
	app.use(errorHandler);
};
