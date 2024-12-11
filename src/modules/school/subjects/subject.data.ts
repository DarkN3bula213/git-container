import { ValidClassName } from '@/lib/constants/classOrder';
import { ISubject, SubjectType } from './subject.model';
import { generateSubjectCode } from './subject.utils';
import { validateSubjectData } from './subject.utils';

export const generateSubjectsData = (): Partial<ISubject>[] => {
	const subjects: Partial<ISubject>[] = [];
	let globalOrder = 0;

	const addSubject = (
		label: string,
		type: SubjectType,
		className: ValidClassName,
		options: Partial<ISubject> = {}
	) => {
		globalOrder++;
		const sequence =
			subjects.filter((s) => s.type === type && s.className === className)
				.length + 1;

		const subject: Partial<ISubject> = {
			label,
			type,
			className,
			orderIndex: globalOrder,
			code: generateSubjectCode({ type, className, sequence }),
			hasComponents: false,
			isActive: true,
			...options
		};

		validateSubjectData(subject);
		subjects.push(subject);
	};

	// Junior Classes (Nursery & Prep)
	['Nursery', 'Prep'].forEach((className) => {
		const validClassName = className as ValidClassName;
		addSubject('English', 'LANGUAGE', validClassName);
		addSubject('Urdu', 'LANGUAGE', validClassName);
		addSubject('Math', 'MATHEMATICS', validClassName);
		addSubject('General Knowledge', 'GENERAL', validClassName);
		addSubject('Drawing', 'ARTS', validClassName);
		addSubject('Nazra Quran', 'RELIGIOUS', validClassName);
	});

	// Elementary Classes (1st to 5th)
	['1st', '2nd', '3rd', '4th', '5th'].forEach((className) => {
		const validClassName = className as ValidClassName;
		addSubject('English', 'LANGUAGE', validClassName);
		addSubject('Urdu', 'LANGUAGE', validClassName);
		addSubject('Math', 'MATHEMATICS', validClassName);
		addSubject('Drawing', 'ARTS', validClassName);
		addSubject('Science', 'SCIENCE', validClassName);
		addSubject('Islamyat', 'RELIGIOUS', validClassName);
		addSubject('Social Studies', 'SOCIAL', validClassName);
		addSubject('Nazra Quran', 'RELIGIOUS', validClassName);
	});

	// Middle Classes (6th to 8th)
	['6th', '7th', '8th'].forEach((className) => {
		const validClassName = className as ValidClassName;
		const englishGroup = `ENGLISH_${className}`;
		const urduGroup = `URDU_${className}`;

		addSubject('English A', 'LANGUAGE', validClassName, {
			hasComponents: true,
			componentGroup: englishGroup
		});
		addSubject('English B', 'LANGUAGE', validClassName, {
			hasComponents: true,
			componentGroup: englishGroup
		});
		addSubject('Urdu A', 'LANGUAGE', validClassName, {
			hasComponents: true,
			componentGroup: urduGroup
		});
		addSubject('Urdu B', 'LANGUAGE', validClassName, {
			hasComponents: true,
			componentGroup: urduGroup
		});
		addSubject('Math', 'MATHEMATICS', validClassName);
		addSubject('Science', 'SCIENCE', validClassName);
		addSubject('Computer', 'COMPUTER', validClassName);
		addSubject('Islamyat', 'RELIGIOUS', validClassName);
		addSubject('Hist.Geo', 'SOCIAL', validClassName);
		addSubject('Tarjam tul Quran', 'RELIGIOUS', validClassName);
	});

	// Senior Classes (9th & 10th)
	['9th', '10th'].forEach((className) => {
		const validClassName = className as ValidClassName;
		const englishGroup = `ENGLISH_${className}`;
		const urduGroup = `URDU_${className}`;
		const mathGroup = `MATH_${className}`;

		addSubject('English A', 'LANGUAGE', validClassName, {
			hasComponents: true,
			componentGroup: englishGroup
		});
		addSubject('English B', 'LANGUAGE', validClassName, {
			hasComponents: true,
			componentGroup: englishGroup
		});
		addSubject('Urdu A', 'LANGUAGE', validClassName, {
			hasComponents: true,
			componentGroup: urduGroup
		});
		addSubject('Urdu B', 'LANGUAGE', validClassName, {
			hasComponents: true,
			componentGroup: urduGroup
		});
		addSubject('Mathematics', 'MATHEMATICS', validClassName, {
			hasComponents: true,
			componentGroup: mathGroup
		});
		addSubject('General Math', 'MATHEMATICS', validClassName, {
			hasComponents: true,
			componentGroup: mathGroup
		});
		addSubject('General Science', 'SCIENCE', validClassName);
		addSubject('Islamyat Com', 'RELIGIOUS', validClassName);
		addSubject('Islamyat Studies', 'RELIGIOUS', validClassName);
		addSubject('Pak Studies', 'SOCIAL', validClassName);
		addSubject('Chemistry', 'SCIENCE', validClassName);
		addSubject('Physics', 'SCIENCE', validClassName);
		addSubject('Biology', 'SCIENCE', validClassName);
		addSubject('Computer', 'COMPUTER', validClassName);
		addSubject('Taram tul Quran', 'RELIGIOUS', validClassName);
	});

	return subjects;
};
