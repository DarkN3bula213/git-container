import { IMigration } from '@/types/migration';
import { add_subjects_to_classes } from './scripts/20240311000000-add_subjects_to_classes';
import { remove_subs } from './scripts/20250206144340-remove_subs';

export const migrations: IMigration[] = [remove_subs, add_subjects_to_classes];
