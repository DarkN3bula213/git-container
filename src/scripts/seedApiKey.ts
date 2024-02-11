import { db } from '@/data/database';
import { Logger } from '@/lib/logger';
import { ApiKeyModel } from '@/modules/auth/apiKey/apiKey.model';
const logger = new Logger(__filename);

export async function seed() {
  const response = await ApiKeyModel.create({
    key: 'GCMUDiuY5a7WvyUNt9n3QztToSHzK7Uj',
    permissions: ['GENERAL'],
    comments: ['To be used by the xyz vendor'],
    version: 1,
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  // logger.info(JSON.stringify(response));
  return response;
}
