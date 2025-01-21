import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import Files from './file.model';

// File util functions

// Create a hash for a file
export const createHashForFile = (file: Express.Multer.File) => {
	const hash = createHash('sha256');
	hash.update(file.buffer);
	return hash.digest('hex');
};

export const calculateFileHash = (filePath: string) => {
	return new Promise((resolve, reject) => {
		const hash = createHash('sha256');
		const stream = createReadStream(filePath);

		stream.on('error', (err) => reject(err));
		stream.on('data', (chunk) => hash.update(chunk));
		stream.on('end', () => resolve(hash.digest('hex')));
	});
};

// Check if a file has been uploaded before
export const checkIfFileHasBeenUploaded = async (filePath: string) => {
	const hash = await calculateFileHash(filePath);
	const file = await Files.findOne({ hash });
	return file ? true : false;
};
