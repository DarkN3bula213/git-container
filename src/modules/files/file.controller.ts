// fileController.ts
import asyncHandler from '@/lib/handlers/asyncHandler';
import { Request, Response } from 'express';
// Import any necessary utilities or services

export const uploadFile =asyncHandler (async (req: Request, res: Response) => {
  // Logic for file upload
  res.status(200).send({ message: 'File uploaded successfully' });
})

export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
    // Logic for file download
    const filePath = ''
  res.status(200).download(filePath);   
});

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  // Logic for file deletion
  res.status(200).send({ message: 'File deleted successfully' });
});


import multer from 'multer';

// Set up multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
import  {UTFiles} from 'uploadthing/express'
