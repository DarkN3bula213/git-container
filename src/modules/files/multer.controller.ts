import { NotFoundResponse, SuccessResponse } from '@/lib/api/ApiResponse';
import { singleUpload } from '@/lib/config/multer';
import { getUploadsDir } from '@/lib/constants';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { getFileMetadata } from '@/lib/utils/getFileMetaData';
import { exec } from 'child_process';
import { Request, Response } from 'express';
import fs from 'fs-extra';
import multer, { MulterError } from 'multer';
import path from 'path';
import { promisify } from 'util';
import Files from './file.model';

const execAsync = promisify(exec);
const logger = new Logger(__filename);

export const downloadFile = asyncHandler(async (req, res) => {
	const { fileName, folder } = req.params;
	const filePath = path.join(getUploadsDir(), folder, fileName);
	logger.info(`Downloading file ${fileName} from ${folder}`);

	if (!fs.existsSync(filePath)) {
		res.status(404).send('File not found.');
		return;
	}

	res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

	res.sendFile(filePath, (err) => {
		if (err) {
			logger.error('Error sending file:', err);
			res.status(500).send('Error sending file.');
		}
	});
});
export const uploadFile = asyncHandler(async (req, res, next) => {
	singleUpload(req, res, (err) => {
		if (err instanceof MulterError) {
			return res.status(500).json({ error: err.message });
		} else if (err) {
			next(err);
		}
		res.status(200).send('File uploaded successfully.');
	});
});

export const listFiles = asyncHandler(async (_req, res) => {
	const filesMetadata = await getFileMetadata();
	res.json(filesMetadata);
});

export const uploadDocument = asyncHandler(
	async (req: Request, res: Response, next) => {
		const upload = singleUpload; // Get the middleware

		// Use the middleware first to parse the multipart form data
		upload(req, res, async (err) => {
			if (err instanceof MulterError) {
				logger.error('Error uploading file:', err);
				return res.status(500).json({ error: err.message });
			} else if (err) {
				logger.error('Error uploading file:', err);
				return next(err);
			}

			// Now req.body will be populated

			const { customName, title, amount, vendor, date } = req.body;

			if (req.file) {
				// If you need to rename the file after upload based on customName
				if (customName) {
					const fileExt = path.extname(req.file.originalname);
					const newFileName = `${customName}${fileExt}`;
					const oldPath = req.file.path;
					const newPath = path.join(
						path.dirname(oldPath),
						newFileName
					);

					// Rename the file
					fs.renameSync(oldPath, newPath);
					req.file.filename = newFileName;
					req.file.path = newPath;
				}

				try {
					const newExpense: unknown = await Files.create({
						title,
						amount,
						vendor,
						date,
						filePath: req.file.path,
						fileName: req.file.filename
					});

					res.status(201).json(newExpense);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} catch (error: any) {
					res.status(400).json({
						error: error.message
					});
				}
			} else {
				res.status(402).json({
					error: 'File is required.'
				});
			}
		});
	}
);

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
	const { fileName, folder } = req.params;
	const filePath = path.join(getUploadsDir(), folder, fileName);
	if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath);
		return new SuccessResponse('File deleted successfully.', null).send(
			res
		);
	}
	return new NotFoundResponse('File not found.').send(res);
});

export const uploadBackup = multer({ dest: '/tmp/uploads/' });

export const backupDb = asyncHandler(async (req, res) => {
	logger.info('Backing up database');
	const backupPath = '/tmp/backup';
	await execAsync(`mongodump --host a956339bc7f1:27017 --out=${backupPath}`);
	await execAsync(`cd ${backupPath} && tar -czf backup.tar.gz *`);

	res.download(`${backupPath}/backup.tar.gz`, 'backup.tar.gz', (err) => {
		execAsync(`rm -rf ${backupPath}`);
		if (err) throw err;
	});
});

export const restoreDb = asyncHandler(async (req, res) => {
	const backupPath = '/tmp/restore';

	if (!req.file) throw new Error('No backup file provided');
	await execAsync(
		`mkdir -p ${backupPath} && tar -xzf ${req.file.path} -C ${backupPath}`
	);
	await execAsync(`mongorestore --host mongo:27017 ${backupPath}`);

	res.json({ message: 'Restore completed' });

	// Cleanup
	await execAsync(`rm -rf ${backupPath} ${req.file.path}`);
	return new SuccessResponse('Database restored successfully.', null).send(
		res
	);
});

export const testBackup = async () => {
	try {
		logger.info('Backing up database');
		const root = process.cwd();
		const backupPath = path.join(root, 'uploads', 'backup');
		await execAsync(
			`mongodump --host a956339bc7f1:27017 --out=${backupPath}`
		);
		await execAsync(`cd ${backupPath} && tar -czf backup.tar.gz *`);
	} catch (error) {
		logger.error({
			error: `Error backing up database: ${JSON.stringify(error, null, 2)}`
		});
	}
};
