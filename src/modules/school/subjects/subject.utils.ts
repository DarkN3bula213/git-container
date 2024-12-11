import {
	TYPE_CODES,
	ValidClassName,
	classOrder
} from '@/lib/constants/classOrder';
import { SubjectType } from './subject.model';
import { ISubject } from './subject.model';

// utils/subjectValidation.ts
export class SubjectValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SubjectValidationError';
	}
}

interface SubjectCodeParams {
	type: SubjectType;
	className: ValidClassName;
	sequence: number;
	hasComponents?: boolean;
	componentIndex?: number;
}

export function generateSubjectCode({
	type,
	className,
	sequence,
	hasComponents = false,
	componentIndex = 0
}: SubjectCodeParams): string {
	// Get type prefix (always 2 letters)
	const typePrefix = TYPE_CODES[type];
	if (!typePrefix) {
		throw new Error(`Invalid subject type: ${type}`);
	}

	// Get class order number (1-12) and pad to 2 digits
	const classNum = classOrder[className].toString().padStart(2, '0');

	// Generate sequence identifier
	let identifier: string;

	if (hasComponents) {
		// For subjects with components (A, B, etc.)
		identifier = String.fromCharCode(65 + (componentIndex % 26));
	} else {
		// For regular subjects (1-9, then A-Z)
		identifier =
			sequence <= 9
				? sequence.toString()
				: String.fromCharCode(65 + (sequence - 10));
	}

	const code = `${typePrefix}${classNum}${identifier}`;

	// Validate the generated code
	if (!/^[A-Z]{2}\d{2}[0-9A-Z]$/.test(code)) {
		throw new Error(`Invalid code generated: ${code}`);
	}

	return code;
}

export function validateSubjectData(subject: Partial<ISubject>): void {
	// Validate code format
	if (!subject.code || !/^[A-Z]{2}\d{2}[0-9A-Z]$/.test(subject.code)) {
		throw new Error(`Invalid subject code format: ${subject.code}`);
	}

	// Validate type code matches
	const typePrefix = subject.code.slice(0, 2);
	if (!subject.type || TYPE_CODES[subject.type] !== typePrefix) {
		throw new Error(
			`Subject code ${subject.code} doesn't match type ${subject.type}`
		);
	}

	// Validate class number matches
	const codeClassNum = parseInt(subject.code.slice(2, 4));
	if (codeClassNum !== classOrder[subject.className || '']) {
		throw new Error(
			`Subject code ${subject.code} doesn't match class ${subject.className}`
		);
	}

	// Validate other required fields
	if (!subject.label?.trim()) {
		throw new Error('Subject label is required');
	}

	if (subject.hasComponents && !subject.componentGroup) {
		throw new Error(
			'Component group is required for subjects with components'
		);
	}
}

// Utility to decode a subject code
export function decodeSubjectCode(code: string) {
	if (!/^[A-Z]{2}\d{2}[0-9A-Z]$/.test(code)) {
		throw new Error(`Invalid subject code format: ${code}`);
	}

	const typePrefix = code.slice(0, 2);
	const classNum = parseInt(code.slice(2, 4));
	const identifier = code.slice(4);

	// Get class name from order number
	const className = Object.entries(classOrder).find(
		([_, order]) => order === classNum
	)?.[0];

	// Get subject type from type code
	const type = Object.entries(TYPE_CODES).find(
		([_, code]) => code === typePrefix
	)?.[0] as SubjectType;

	return {
		type,
		className,
		classNum,
		identifier,
		isComponent: /[A-Z]/.test(identifier)
	};
}
