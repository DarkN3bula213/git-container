import { Student } from '@/modules/school/students/student.interface';
import { Collection } from 'mongoose';
import { classOrder } from '../constants/classOrder';

export async function getSortedStudents(
	studentCollection: Collection<Student>
): Promise<Student[]> {
	const pipeline = [
		{
			$match: {
				'status.hasLeft': { $ne: true } // Only get active students
			}
		},
		{
			// Add a sortOrder field based on classOrder
			$addFields: {
				classOrder: {
					$switch: {
						branches: [
							{
								case: { $eq: ['$className', 'Nursery'] },
								then: 1
							},
							{ case: { $eq: ['$className', 'Prep'] }, then: 2 },
							{ case: { $eq: ['$className', '1st'] }, then: 3 },
							{ case: { $eq: ['$className', '2nd'] }, then: 4 },
							{ case: { $eq: ['$className', '3rd'] }, then: 5 },
							{ case: { $eq: ['$className', '4th'] }, then: 6 },
							{ case: { $eq: ['$className', '5th'] }, then: 7 },
							{ case: { $eq: ['$className', '6th'] }, then: 8 },
							{ case: { $eq: ['$className', '7th'] }, then: 9 },
							{ case: { $eq: ['$className', '8th'] }, then: 10 },
							{ case: { $eq: ['$className', '9th'] }, then: 11 },
							{ case: { $eq: ['$className', '10th'] }, then: 12 }
						],
						default: 999
					}
				}
			}
		},
		{
			$sort: {
				classOrder: 1, // First sort by class order
				section: 1, // Then by section
				name: 1 // Then alphabetically by name
			}
		},
		{
			$project: {
				classOrder: 0 // Remove the temporary sorting field
			}
		}
	];

	return (await studentCollection
		.aggregate(pipeline)
		.toArray()) as unknown as Student[];
}

// Usage:
// const sortedStudents = await getSortedStudents(studentCollection);
// Result will be flat array of students sorted by class (Nursery -> 10th),
// then by section (A -> E), then alphabetically by name

export function sortStudents(students: Student[]): Student[] {
	return [...students].sort((a, b) => {
		// First, compare by class order
		const classOrderA = classOrder[a.className as ClassName] || 999;
		const classOrderB = classOrder[b.className as ClassName] || 999;

		if (classOrderA !== classOrderB) {
			return classOrderA - classOrderB;
		}

		// If same class, compare by section
		if (a.section !== b.section) {
			return a.section.localeCompare(b.section);
		}

		// If same section, sort alphabetically by name
		return a.name.localeCompare(b.name);
	});
}
type ClassName = keyof typeof classOrder;

// Helper function to get class order number (can be useful for other sorting needs)
export function getClassOrder(className: string): number {
	return classOrder[className as ClassName] || 999;
}

// Usage examples:
/*
// Sort an array of students
const sortedStudents = sortStudents(fetchedStudents);

// Sort and filter example
const activeSortedStudents = sortStudents(
    fetchedStudents.filter(student => student.status?.isActive)
);

// Using with array methods
const sortedFilteredStudents = fetchedStudents
    .filter(student => someCondition)
    .map(student => transformStudent(student))
    .sort((a, b) => getClassOrder(a.className) - getClassOrder(b.className));
*/
