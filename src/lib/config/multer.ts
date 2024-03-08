import multer from 'multer';

// import fs from 'fs';
// import path from 'path';

// // Ensure the uploads directory exists
// const uploadsDir = path.join(__dirname,'..', './uploads'); // Adjust __dirname based on where this script is located
// fs.existsSync(uploadsDir) || fs.mkdirSync(uploadsDir, { recursive: true });

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadsDir);
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname)); // Append the date to the original file name
//   },
// });

// export const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
// });



const memStorage = multer.memoryStorage();
export const memUpload = multer({ storage: memStorage })


export const supaUpload = multer({
  storage: memStorage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit to 5MB
});
  