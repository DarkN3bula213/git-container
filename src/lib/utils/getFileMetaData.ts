// fileUtils.ts

import fs from 'fs-extra';
import path, { resolve } from 'path';

const STORAGE_BASE_PATH = resolve('uploads'); // Adjust based on actual location

// List of image file extensions for categorization
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

export async function getFileMetadata() {
  const documentsPath = path.join(STORAGE_BASE_PATH, 'documents');
  const imagesPath = path.join(STORAGE_BASE_PATH, 'images');

  const documentFiles = await fs.readdir(documentsPath);
  const imageFiles = await fs.readdir(imagesPath);

  const combinedFiles = [
    ...documentFiles.map((file) => ({ file, type: 'document' })),
    ...imageFiles.map((file) => ({ file, type: 'image' })),
  ];

  const filesMetadata = await Promise.all(
    combinedFiles.map(async ({ file, type }) => {
      const filePath =
        type === 'image'
          ? path.join(imagesPath, file)
          : path.join(documentsPath, file);
      const stats = await fs.stat(filePath);

      return {
        name: file,
        size: stats.size,
        mimeType: path.extname(file),
        createdAt: stats.birthtime,
        updatedAt: stats.mtime,
        path: type === 'image' ? `images/${file}` : `documents/${file}`, // Path relative to STORAGE_BASE_PATH
      };
    }),
  );

  return filesMetadata;
}
