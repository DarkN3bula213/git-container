import { NextFunction, Request, Response } from 'express';
import xss from 'xss';

// Generic middleware to sanitize all strings in req.body, req.query, and req.params
const sanitizeInputs = (req: Request, _res: Response, next: NextFunction) => {
	// Function to recursively sanitize all strings in an object
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const sanitizeObject = (obj: Record<string, any>) => {
		for (const key in obj) {
			if (typeof obj[key] === 'string') {
				obj[key] = xss(obj[key]);
			} else if (typeof obj[key] === 'object' && obj[key] !== null) {
				sanitizeObject(obj[key]);
			}
		}
	};

	if (req.body) {
		sanitizeObject(req.body);
	}
	if (req.query) {
		sanitizeObject(req.query);
	}
	if (req.params) {
		sanitizeObject(req.params);
	}

	next();
};

export default sanitizeInputs;
