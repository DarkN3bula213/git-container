import { faker } from '@faker-js/faker';

export const studentData = {
  name: 'Khawaja Fazal Ur Rehman',
  father_name: 'Khawaja Abdul Rasheed Rathore',
  gender: 'male',
  cnic: '34603-6721888-7',
  dob: '1974-11-22',

  password: 'temp1234',
};
type Student = typeof studentData;
function genStudent() {
  const stundetArray: Partial<Student>[] = [];
  for (let index = 0; index < 10; index++) {
    stundetArray.push({
      name: faker.person.fullName(),
      father_name: faker.person.fullName(),
      gender: faker.person.gender(),

      dob: faker.date.birthdate() as unknown as string,
    });
  }
  return stundetArray;
}


export const students = genStudent();