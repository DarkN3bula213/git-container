import asyncHandler from '@/lib/handlers/asyncHandler';

export const handleFileUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  res.status(200).json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      filename: req.file.filename,
      path: req.file.path,
    },
  });
});

import { supabase } from '@/lib/utils/supabase';

export const downloadFile = asyncHandler(async (req, res) => {
  const bucketName = 'utility'; // Your actual bucket name
  const filePath = `uploads/${req.params.filename}`; // Construct the file path

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 3600);

  if (data) {
    console.log(data.signedUrl);
  }

  if (error) {
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'File URL generated successfully',
    data: { data },
  });
});

export const deleteFile = asyncHandler(async (req, res) => {
  const bucketName = 'utility';
  const filePath = `uploads/${req.params.filename}`;

  const { error } = await supabase.storage.from(bucketName).remove([filePath]);

  if (error) throw error;

  res.status(200).json({
    success: true,
    message: 'File deleted successfully',
  });
});

// Get available files

export const getFiles = asyncHandler(async (_req, res) => {
  const bucketName = 'utility';
  const directory = 'uploads';

  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(directory);

  if (error) throw error;

  res.status(200).json({
    success: true,
    message: 'Files retrieved successfully',
    data: data,
  });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file provided' });
  }
  // Upload file to Supabase
  const { data, error } = await supabase.storage
    .from('utility') // Replace 'your-bucket-name' with your actual bucket name
    .upload(`uploads/${file.originalname}`, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) throw error;

  const uploadedFilePath = data.path;

  res.status(200).json({
    success: true,
    message: 'File uploaded successfully',
    data: { filePath: uploadedFilePath }, // Updated to use 'path'
  });
});
