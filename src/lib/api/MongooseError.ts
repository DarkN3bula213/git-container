import mongoose from 'mongoose';
import { Request, Response } from 'express';
import {
    MongooseValidationError,
    MongooseDuplicateKeyError,
    MongooseCastError,
    MongooseGeneralError
} from '.';

export const handleMongooseError = (
    err: mongoose.Error,
    req: Request,
    res: Response
) => {
    if (err instanceof mongoose.Error.ValidationError) {
        throw new MongooseValidationError(err.message);
    } else if (err instanceof mongoose.Error.CastError) {
        throw new MongooseCastError(err.message);
    } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
        res.status(404).json({ error: 'Document not found' });
    } else if (err instanceof mongoose.Error.MongooseServerSelectionError) {
        throw new MongooseGeneralError(err.message);
    } else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
        throw new MongooseDuplicateKeyError('Duplicate key error');
    } else {
        throw new MongooseGeneralError(err.message);
    }
};
