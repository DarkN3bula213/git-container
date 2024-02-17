import { Logger } from '@/lib/logger';
import bcrypt, { compare } from 'bcrypt';
function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

const logger = new Logger(__filename);

export async function main() {
  const password = 'Daltone213';

  const hashedPassword = await hashPassword(password);

  const isMatch = await compare(password, hashedPassword);

  logger.debug({
    password,
    hashedPassword,
    isMatch,
  });
}
