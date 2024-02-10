import { ClassModel } from '@/modules/school/classes/class.model';
import { Student } from '@/modules/school/students/student.interface';
import StudentModel from '@/modules/school/students/student.model';
import { faker } from '@faker-js/faker';
import { promises as fs } from 'fs';
import { generateRandomString } from '@/lib/utils/generators';

// Example seeding function
export async function seedStudentData(studentData: Partial<Student>) {
  try {
    const classId = await StudentModel.getClassIdByName(studentData.className!);
    const newStudent = new StudentModel({
      ...studentData,
      classId, // Set the classId from the found class document
    });
    await newStudent.save();
  } catch (error) {
    console.error('Error seeding student data:', error);
  }
}

export async function updateStudentClassIds() {
  const students = await StudentModel.find({}).exec();
  let count = 0;

  console.log(students);
  for (let student of students) {
    const classDoc = await ClassModel.findOne({
      className: student.classId,
    }).exec();
    if (classDoc) {
      student.classId = classDoc._id.toString();
      student.className = classDoc.className;
      await student.save();
      count++;

      console.log('found', Date.now());
    } else {
      console.log(
        `No class found with name ${student.classId} for student ${student._id}`,
      );
    }
  }
  console.log(`"All student classIds updated successfully" ${count}`);
}

export const sample = async () => {
  const generateData = () => ({
    name: faker.person.fullName(),
    dob: faker.date.past(),
    place_of_birth: faker.location.city(),
    father_name: faker.person.fullName(),
    form_b: faker.word.adjective(),
    gender: faker.person.sex(),
    phone: faker.phone.number(),
    address: faker.location.street(),
    cast: faker.word.adjective(),
    father_occupation: faker.person.jobType(),
    father_cnic: generateRandomString(13),
    religion: faker.helpers.arrayElement(['Islam', 'Christianity', 'Hinduism']),
    classId: faker.helpers.arrayElement(oIds),
    section: faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'E']),
  });
  const result = Array.from({ length: 100 }, generateData); // Generates an array of unique objects
  try {
    await fs.writeFile('./content.json', JSON.stringify(result, null, 2)); // Beautify JSON output
    console.log('Data successfully written to content.json');
  } catch (err) {
    console.error('Error writing file:', err);
  }
};

const oIds = [
  '65ac39246838eff275c6bb9c',
  '65ac39246838eff275c6bb9d',
  '65ac39246838eff275c6bb9e',
];
