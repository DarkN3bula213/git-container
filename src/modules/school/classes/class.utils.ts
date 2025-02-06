import { Types } from 'mongoose';
import { IClassSubject } from './interfaces';

export function generateSubjectId(subjectName: string, level: string): string {
	const abbreviations: { [key: string]: string } = {
		English: 'ENG',
		English_A: 'EGA',
		English_B: 'EGB',
		Urdu: 'URD',
		Urdu_A: 'URA',
		Urdu_B: 'URB',
		Math: 'MAT',
		Gen_Math: 'GMA',
		Science: 'SCI',
		Gen_Science: 'GSC',
		Drawing: 'DRW',
		Nazra_Quran: 'NZQ',
		Islamiyat: 'ISL',
		Islamiyat_Com: 'ISC',
		Social_Studies: 'SST',
		Computer: 'COM',
		History_Geo: 'HGE',
		Tarjama_tul_Quran: 'TTQ',
		Islamic_Studies: 'IST',
		Pak_Studies: 'PAK',
		Chemistry: 'CHE',
		Physics: 'PHY',
		Biology: 'BIO'
	};

	const subjectCode =
		abbreviations[subjectName.replace(/\s/g, '_')] ||
		subjectName.substring(0, 3).toUpperCase();
	const levelCode = level.substring(0, 1).toUpperCase();

	return `${subjectCode}${levelCode}`;
}

export function createIClassSubject(
	data: Partial<IClassSubject>,
	className: string,
	classId: Types.ObjectId,
	teacherName: string
): IClassSubject {
	if (!data.name) {
		throw new Error('Missing required fields');
	}
	const dataTransform: IClassSubject = {
		_id: data._id ?? new Types.ObjectId(),
		subjectId: generateSubjectId(data.name, className),
		name: data.name,
		teacherId: data.teacherId ?? '', // Ensure optional fields are handled
		classId: classId,
		level: className,
		prescribedBooks: data.prescribedBooks ?? [],
		teacherName: teacherName
	};
	return dataTransform;
}
