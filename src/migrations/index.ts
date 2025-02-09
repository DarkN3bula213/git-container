import { IMigration } from '@/types/migration';
import { add_subjects } from './scripts/20240311000000-add_subjects_to_classes';
import { remove_subjects_from_classes } from './scripts/20250209063106-remove_subjects_from_classes';

export const migrations: IMigration[] = [
	add_subjects,
	remove_subjects_from_classes
];
