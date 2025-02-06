// import { config } from '@/lib/config/config';
import { config } from '@/lib/config/config';
import { Logger } from '@/lib/logger';
import TeacherModel from '@/modules/school/teachers/teacher.model';
import fs from 'fs/promises';
import path from 'path';

const logger = new Logger(__filename);

// const URI = `mongodb://${config.mongo.user}:${encodeURIComponent(config.mongo.pass)}@127.0.0.1:27017/docker-db?replicaSet=rs0`;

export async function main() {
	try {
		// Connect using your existing config
		// await mongoose.connect(URI);

		logger.info('Deleting existing teachers...');
		await TeacherModel.deleteMany({});

		// Look for the file in the migrations directory
		const filePath = path.join(
			process.cwd(),
			'migrations/transformed_teachers.json'
		);

		logger.info(
			`Environment: ${config.node}, isProduction: ${config.isProduction}`
		);
		logger.info(`Reading teachers data from: ${filePath}`);

		// Read the transformed data
		const teachers = JSON.parse(await fs.readFile(filePath, 'utf-8'));

		logger.info('Inserting transformed teachers data...');
		const result = await TeacherModel.insertMany(teachers);

		logger.info(`Successfully inserted ${result.length} teacher records`);

		// Verify the data
		const count = await TeacherModel.countDocuments();
		logger.info(`Total documents in collection: ${count}`);

		const sample = await TeacherModel.findOne();
		if (sample) {
			logger.info('\nSample document:');
			logger.info(JSON.stringify(sample.toJSON(), null, 2));
		}
	} catch (error) {
		logger.error('Error during reload:', error);
		throw error;
	}
}
