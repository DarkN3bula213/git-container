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
		singleUpload(req, res, async (err) => {
			if (err instanceof MulterError) {
				logger.error('Error uploading file:', err);
				return res.status(500).json({ error: err.message });
			} else if (err) {
				logger.error('Error uploading file:', err);
				return next(err);
			}

			// Assuming the rest of the form data is available in req.body
			// and the file path is available in req.file.path
			if (req.file) {
				const { title, amount, vendor, date } = req.body;
				const filePath = req.file.path; // The path where the file is saved

				try {
					// Create a new document in the Expense collection
					const newExpense = await Files.create({
						title,
						amount,
						vendor,
						date,
						filePath
					});
					logger.debug(newExpense);
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
		res.status(200).send('File deleted successfully.');
	}
	res.status(404).send('File not found.');
});
