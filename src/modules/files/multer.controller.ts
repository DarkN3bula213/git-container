import { singleUpload } from '@/lib/config/multer';
import { uploadsDir } from '@/lib/constants';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Logger } from '@/lib/logger';
import { getFileMetadata } from '@/lib/utils/getFileMetaData';
import fs from 'fs-extra';
import { MulterError } from 'multer';
import path from 'path';

const logger = new Logger(__filename);

export const downloadFile = asyncHandler(async (req, res) => {
  const { fileName, folder } = req.params;
  const filePath = path.join(uploadsDir, folder, fileName);
  logger.info({
    path: filePath,
    params: req.params,
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

export const listFiles = asyncHandler(async (req, res) => {
  const filesMetadata = await getFileMetadata();
  res.json(filesMetadata);
});
