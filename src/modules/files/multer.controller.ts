import { NotFoundResponse } from '@/lib/api/ApiResponse';
import { SuccessResponse } from '@/lib/api/ApiResponse';
import { singleUpload } from '@/lib/config/multer';
import { uploadsDir } from '@/lib/constants';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { getFileMetadata } from '@/lib/utils/getFileMetaData';
import { Request, Response } from 'express';
import fs from 'fs-extra';
import { MulterError } from 'multer';
import path from 'path';
import Files from './file.model';

const logger = new Logger(__filename);

export const downloadFile = asyncHandler(async (req, res) => {
	const { fileName, folder } = req.params;
	const filePath = path.join(uploadsDir, folder, fileName);
	logger.info({
		path: filePath,
		params: req.params
	});

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
			console.log('Request body after upload:', req.body);
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
					const newExpense: any = await Files.create({
						title,
						amount,
						vendor,
						date,
						filePath: req.file.path,
						fileName: req.file.filename
					});

					logger.debug({
						event: 'file_uploaded',
						data: JSON.stringify(newExpense, null, 2)
					});

					res.status(201).json(newExpense);
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
	const filePath = path.join(uploadsDir, folder, fileName);
	if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath);
		return new SuccessResponse('File deleted successfully.', null).send(
			res
		);
	}
	return new NotFoundResponse('File not found.').send(res);
});
