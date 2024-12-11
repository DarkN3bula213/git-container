import { SubjectType } from '@/modules/school/subjects/subject.model';

export const classOrder: { [key: string]: number } = {
	Nursery: 1,
	Prep: 2,
	'1st': 3,
	'2nd': 4,
	'3rd': 5,
	'4th': 6,
	'5th': 7,
	'6th': 8,
	'7th': 9,
	'8th': 10,
	'9th': 11,
	'10th': 12
};

// Define the canonical order of classes as a const array
export const CLASS_ORDER = [
	'Nursery',
	'Prep',
	'1st',
	'2nd',
	'3rd',
	'4th',
	'5th',
	'6th',
	'7th',
	'8th',
	'9th',
	'10th'
] as const;

// Create a type from the array
export type ValidClassName = (typeof CLASS_ORDER)[number];

export const TYPE_CODES: { [key in SubjectType]: string } = {
	LANGUAGE: 'LN',
	MATHEMATICS: 'MA',
	SCIENCE: 'SC',
	RELIGIOUS: 'RE',
	SOCIAL: 'SO',
	COMPUTER: 'CP',
	ARTS: 'AR',
	GENERAL: 'GN'
};
