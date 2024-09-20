/**
 * Transforms a single teacher's data from the initial flat structure to the nested structure required by the schema.
 * @param teacher The initial flat teacher data.
 * @returns The transformed teacher data.
 */
export function transformTeacherData(teacher: any) {
	return {
		first_name: teacher.first_name,
		last_name: teacher.last_name,
		gender: teacher.gender,
		father_name: teacher.father_name,
		address: teacher.address,
		cnic: teacher.cnic,
		phone: teacher.phone,
		dob: teacher.dob,
		qualification: {
			degree: teacher.qualification,
			year: teacher.completion,
			institution: teacher.institution,
			marks: teacher.score
		},
		appointment: {
			designation: teacher.designation,
			date: teacher.appointment,
			appointed_by: teacher.appointed_by,
			salary: teacher.salary
		}
	};
}
