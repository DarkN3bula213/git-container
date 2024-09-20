import type { Application, NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { MulterError } from 'multer';

import { ApiError, ErrorType, InternalError, NotFoundError } from '../api';
import { handleMongooseError } from '../api/MongooseError';
import { config } from '../config';
import { Logger } from '../logger';

const logger = new Logger(__filename);
export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
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

	// Duplicate Key
	if ((err as any).code === 11000) {
		const message = `Duplicate field value entered`;
		error = new InternalError(message);
	}

	// Validation Error
	if (err.name === 'ValidationError') {
		const message = Object.values((err as any).errors)
			.map((val: any) => val.message)
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
