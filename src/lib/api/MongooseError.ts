import { ProductionLogger } from '@/lib/logger/v1/logger';
import { Student } from '@/modules/school/students/student.interface';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
	MongooseCastError,
	MongooseDuplicateKeyError,
	MongooseGeneralError,
	MongooseValidationError
} from '.';

const logger = new ProductionLogger(__filename);
export const handleMongooseError = (
	err: mongoose.Error,
	_req: Request,
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
		throw new MongooseDuplicateKeyError('Duplicate key error');
	} else {
		throw new MongooseGeneralError(err.message);
	}
};
interface DuplicateKeyError extends MongooseDuplicateKeyError {
	code: 11000;
	keyPattern: Record<string, number>;
	keyValue: Record<string, unknown>;
}

export function isDuplicateKeyError(
	error: unknown
): error is DuplicateKeyError {
	return (
		error instanceof MongooseDuplicateKeyError &&
		'code' in error &&
		error.code === 11000
	);
}

export async function formatDuplicateKeyError(
	err: DuplicateKeyError
): Promise<string> {
	const fields = Object.keys(err.keyPattern);

	if (fields.length > 1) {
		// Handle compound index violations
		if (fields.includes('studentId') && fields.includes('payId')) {
			try {
				// Look up the student name
				const student = (await mongoose
					.model('Student')
					.findById(err.keyValue.studentId)

					.lean()) as Student | null;

				if (student) {
					return `Payment with ID ${err.keyValue.payId} already exists for student ${student.name}`;
				}
			} catch (lookupError) {
				logger.error('Error looking up student details:', lookupError);
			}
		}

		// Generic compound index message if specific handling fails
		const values = fields.map(
			(field) => `${field}: ${err.keyValue[field]}`
		);
		return `Duplicate entry for combined fields: ${values.join(', ')}`;
	} else {
		// Handle single field index violations
		const field = fields[0];
		const value = err.keyValue[field];

		// Handle specific fields
		switch (field) {
			case 'studentId':
				try {
					const student = (await mongoose
						.model('Student')
						.findById(value)
						.select('firstName lastName')
						.lean()) as Student | null;
					return student
						? `A payment already exists for student ${student.name}`
						: `A payment already exists for this student`;
				} catch (lookupError) {
					logger.error(
						'Error looking up student details:',
						lookupError
					);
					return `A payment already exists for this student`;
				}

			case 'invoiceId':
				return `An invoice with ID ${value} already exists`;

			default:
				return `Duplicate value '${value}' for field '${field}'`;
		}
	}
}
