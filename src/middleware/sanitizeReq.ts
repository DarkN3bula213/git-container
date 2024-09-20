import { NextFunction, Request, Response } from 'express';
import xss from 'xss';

// Generic middleware to sanitize all strings in req.body, req.query, and req.params
const sanitizeInputs = (req: Request, _res: Response, next: NextFunction) => {
	// Function to recursively sanitize all strings in an object
	const sanitizeObject = (obj: any) => {
		for (const key in obj) {
			if (typeof obj[key] === 'string') {
				obj[key] = xss(obj[key]);
			} else if (typeof obj[key] === 'object' && obj[key] !== null) {
				sanitizeObject(obj[key]);
			}
		}
	};

	// @ts-ignore
	let sanitized = false;

	if (req.body) {
		sanitizeObject(req.body);
		sanitized = true;
	}
	if (req.query) {
		sanitizeObject(req.query);
		sanitized = true;
	}
	if (req.params) {
		sanitizeObject(req.params);
		sanitized = true;
	}

	// if (sanitized) {
	//   logger.info(
	//     `Request sanitized at ${new Date().toISOString()}: ${req.method} ${req.url}`,
	//   );
	// }

	next();
};

export default sanitizeInputs;
