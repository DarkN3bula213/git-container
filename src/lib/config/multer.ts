import multer from 'multer';

const memStorage = multer.memoryStorage();
export const memUpload = multer({ storage: memStorage });

export const supaUpload = multer({
  storage: memStorage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit to 5MB
});

import { type StorageEngine, diskStorage } from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage: storage });

import { type Application, static as static_ } from 'express';
import { uploadsDir } from '../constants';

export const handleUploads = (app: Application) => {
  app.use(static_(`${process.cwd()}/uploads`));
};

export const multi_upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      const err = new Error('Only .png, .jpg and .jpeg format allowed!');
      err.name = 'ExtensionError';
      return cb(err);
    }
  },
}).array('uploadedImages', 2);

const STORAGE_BASE_PATH = 'uploads';

// Custom storage engine
export const singles: StorageEngine = multer.diskStorage({
  destination: (_req, file, cb) => {
    // Define the base path for 'documents' and 'images'
    const documentsPath = path.join(STORAGE_BASE_PATH, 'documents');
    const imagesPath = path.join(STORAGE_BASE_PATH, 'images');

    // Check file type and set destination accordingly
    const extension = path.extname(file.originalname).toLowerCase();
    let destinationPath = documentsPath; // Default to documents

    // List of image file extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    if (imageExtensions.includes(extension)) {
      destinationPath = imagesPath;
    }

    // Ensure the directory exists
    fs.mkdirSync(destinationPath, { recursive: true });

    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    // Extract the suffix from the request, e.g., "invoice", "bill", "memo"
    const suffix = req.body.suffix || '-'; // Fallback suffix
    const dateSuffix = new Date()
      .toLocaleDateString('en-GB')
      .replace(/\//g, '-');
    const filename = `${path.basename(file.originalname, path.extname(file.originalname))}-${dateSuffix}-${suffix}${path.extname(file.originalname)}`;

    cb(null, filename);
  },
});

export const file = multer({ storage: singles });

export const singleUpload = multer({ storage: singles }).single('file');

export const multipleUpload = multer({ storage: singles }).array('files', 5);

export const fieldsUpload = multer({ storage: singles }).fields([
  { name: 'document', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);
