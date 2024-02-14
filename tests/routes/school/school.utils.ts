import { faker } from '@faker-js/faker';

export const inValidstudentData = {
  name: 'Kelley Pfeffer DVM',
  dob: '1967-06-10T12:54:35.078Z',
  place_of_birth: 'Port Ezekiel',
  b_form: 'de5d0f54-dd55-4660-a4c5-b3ef17340a30',
  gender: 'male',
  father_name: 'Dr. Dan Zboncak',
  address: '60954 Manor Way',
  cast: 'OBC',
  father_occupation: 'Regional Paradigm Analyst',
  father_cnic: '49043594-828c-4965-90b1-17bae761424b',
  religion: 'Islam',
  phone: '322.674.9694',
  registration_no: '6aada333-3652-410f-b5f7-552d4aff3462',
  className: '4th',
  section: 'A',
  tuition_fee: 1359,
};
export const studentData = {
  name: 'Kelley Pfeffer DVM',
  dob: '1967-06-10T12:54:35.078Z',
  place_of_birth: 'Port Ezekiel',
  b_form: 'de5d0f54-dd55-4660-a4c5-b3ef17340a30',
  gender: 'male',
  father_name: 'Dr. Dan Zboncak',
  address: '60954 Manor Way',
  father_occupation: 'Regional Paradigm Analyst',
  father_cnic: '1234567890123',
  religion: 'Islam',
  phone: '22.674.9694',
  className: '4th',
  section: 'A',
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