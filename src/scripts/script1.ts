import Joi, { number } from 'joi';
import { faker } from '@faker-js/faker';
import { Student } from '@/modules/school/students/student.interface';
import { promises as fs } from 'fs';
interface MockDataGenerator {
  generateMockData(schema: Joi.Schema): any;
}

class JoiMockDataGenerator implements MockDataGenerator {
  generateMockData(schema: Joi.Schema): any {
    // This will hold the generated mock data
    const result: Record<string, any> = {};

    // Retrieve the schema description
    const description = schema.describe() as Joi.Description;

    if (description.type === 'object' && description.children) {
      for (const key in description.children) {
        const child = description.children[key];
        // Generate data based on the type of each child schema
        result[key] = this.generateFieldMockData(child);
      }
    }

    return result;
  }

  private generateFieldMockData(field: Joi.Description): any {
    switch (field.type) {
      case 'string':
        // Use Faker to generate a string. This can be customized further based on specific Joi string constraints.
        return faker.string.sample();
      case 'number':
        // Generate a number. Again, this can be refined to use specific number ranges from the Joi schema.
        return faker.number.int();
      case 'boolean':
        // Generate a boolean.
        return faker.datatype.boolean();
      default:
        // For unsupported types, return null for now. We can expand this with more types as needed.
        return null;
    }
  }
}

// Example usage
const exampleSchema = Joi.object({
  username: Joi.string().required(),
  age: Joi.number().integer().min(18).required(),
  active: Joi.boolean(),
});

const generator = new JoiMockDataGenerator();
export const mockData = generator.generateMockData(exampleSchema);
console.log(mockData);

function createRandomUser(): Partial<Student> {
  return {
    name: faker.person.fullName(),
    dob: faker.date.birthdate(),
    place_of_birth: faker.location.city(),
    b_form: faker.string.uuid(),
    gender: faker.helpers.arrayElement(['male', 'female']),
    father_name: faker.person.fullName(),
    address: faker.location.streetAddress(),
    cast: faker.helpers.arrayElement(['General', 'OBC', 'SC', 'ST']),
    father_occupation: faker.person.jobTitle(),
    father_cnic: faker.string.uuid(),
    religion: faker.helpers.arrayElement(['Islam', 'Christianity', 'Hinduism']),
    phone: faker.phone.number(),
    registration_no: faker.string.uuid(),
    className: faker.helpers.arrayElement([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '5th',
      '6th',
      '7th',
      '8th',
      '9th',
      '10th',
    ]),
    section: faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'E']),
    tuition_fee: faker.number.int({
      min: 1000,
      max: 5000,
    }),
  };
}

export const genStudentSeed = async (number: number) => {
  const result = Array.from({ length: number }, createRandomUser);
  try {
    await fs.writeFile(
      './student_content.json',
      JSON.stringify(result, null, 2),
    ); // Beautify JSON output
    console.log('Data successfully written to content.json');
  } catch (err) {
    console.error('Error writing file:', err);
  }
};
