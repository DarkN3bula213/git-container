import { type Application, static as static_ } from 'express';
import multer, { MulterError, StorageEngine } from 'multer';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { uploadsDir } from '../constants';

// Base path for uploads
const STORAGE_BASE_PATH = 'uploads';

// Ensure directories exist for uploads
const ensureDirectoryExists = (directory: string) => {
	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory, { recursive: true });
	}
};

/**
 * Memory storage configuration
 * This is used when you don't want to store files on disk and plan to handle them directly in memory (e.g., for cloud uploads).
 */
const memStorage = multer.memoryStorage();
export const memUpload = multer({ storage: memStorage });

/**
 * SupaUpload: Memory storage with a file size limit
 */
export const supaUpload = multer({
	storage: memStorage,
	limits: { fileSize: 1024 * 1024 * 5 } // Limit to 5MB
});

/**
 * Disk storage configuration for uploading files to specific directories based on file type (e.g., documents and images).
 */

const diskStorage: StorageEngine = multer.diskStorage({
	destination: (_req, file, cb) => {
		// Define paths for different file types
		const documentsPath = path.join(STORAGE_BASE_PATH, 'documents');
		const imagesPath = path.join(STORAGE_BASE_PATH, 'images');

		// Set default to documents, unless file is an image
		let destinationPath = documentsPath;
		const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

		// Check the file extension to determine destination
		if (
			imageExtensions.includes(
				path.extname(file.originalname).toLowerCase()
			)
		) {
			destinationPath = imagesPath;
		}

		// Ensure the destination directory exists
		ensureDirectoryExists(destinationPath);
		cb(null, destinationPath);
	},
	filename: function (_req, file, cb) {
		// Use cryptographically secure random bytes instead of Math.random()
		const uniqueSuffix = `${Date.now()}-${randomBytes(4).toString('hex')}`;
		cb(null, `temp-${uniqueSuffix}${path.extname(file.originalname)}`);
	}
});

/**
 * General-purpose file upload using disk storage.
 */
export const fileUpload = multer({
	storage: diskStorage,
	limits: { fileSize: 1024 * 1024 * 10 } // 10MB limit
});

/**
 * Single file upload configuration (field name: "document")
 */
export const singleUpload = fileUpload.single('file');
/**
 * Single file upload configuration for the field "document".
 */
export const singleDocumentUpload = fileUpload.single('document');

/**
 * Multiple file upload configuration (limits to 5 files, max 1MB each)
 */
export const multipleUpload = multer({
	storage: diskStorage,
	limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit per file
	fileFilter: (_req, file, cb) => {
		const validTypes = ['image/png', 'image/jpg', 'image/jpeg'];
		if (validTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(null, false);
			cb(
				new MulterError(
					'LIMIT_UNEXPECTED_FILE',
					'Only .png, .jpg, and .jpeg formats are allowed!'
				)
			);
		}
	}
}).array('uploadedImages', 5); // Limit to 5 files

/**
 * Uploads multiple files with custom fields (documents and images)
 */
export const fieldsUpload = fileUpload.fields([
	{ name: 'document', maxCount: 1 },
	{ name: 'image', maxCount: 1 }
]);

/**
 * Serve static uploaded files
 */
export const handleUploads = (app: Application) => {
	ensureDirectoryExists(uploadsDir);
	app.use(static_(`${process.cwd()}/uploads`));
};

export const customFileName = (customName?: string) => {
	const storage = multer.diskStorage({
		destination: function (_req, file, cb) {
			// Define paths for different file types
			const documentsPath = path.join(STORAGE_BASE_PATH, 'documents');
			const imagesPath = path.join(STORAGE_BASE_PATH, 'images');

			// Set default to documents, unless file is an image
			let destinationPath = documentsPath;
			const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

			// Check the file extension to determine destination
			if (
				imageExtensions.includes(
					path.extname(file.originalname).toLowerCase()
				)
			) {
				destinationPath = imagesPath;
			}

			// Ensure the destination directory exists
			ensureDirectoryExists(destinationPath);
			cb(null, destinationPath);
		},
		filename: function (_req, file, cb) {
			if (customName) {
				// Use the custom name while preserving the file extension
				const fileExt = path.extname(file.originalname);
				cb(null, `${customName}${fileExt}`);
			} else {
				// Fallback to default naming if no custom name provided
				const uniqueSuffix = `${Date.now()}-${randomBytes(4).toString('hex')}`;
				cb(
					null,
					file.fieldname +
						'-' +
						uniqueSuffix +
						path.extname(file.originalname)
				);
			}
		}
	});

	return multer({
		storage: storage,
		limits: { fileSize: 1024 * 1024 * 10 }
	}).single('file');
};
