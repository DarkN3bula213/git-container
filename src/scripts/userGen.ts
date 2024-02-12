import { promises as fs } from 'fs';
import { faker } from '@faker-js/faker';

export async function generateUsers() {
  const users = [];

  for (let i = 0; i < 100; i++) {
    users.push({
      name: faker.name.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    });
  }

  try {
    await fs.writeFile('./content.json', JSON.stringify(users, null, 2)); // Beautify JSON output
    console.log('Data successfully written to content.json');
  } catch (err) {
    console.error('Error writing file:', err);
  }
}
