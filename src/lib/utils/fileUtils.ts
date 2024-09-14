import fs from 'node:fs';

export function ensureDirSync(dirPath: string): void {
   if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
   }
}

export const createNewDirectory = (dirPath: string): void => {
   ensureDirSync(dirPath);
};

export const renameFile = (oldPath: string, newPath: string): void => {
   fs.renameSync(oldPath, newPath);
};

export const deleteFile = (filePath: string): void => {
   fs.unlinkSync(filePath);
};

export const deleteDirectory = (dirPath: string): void => {
   fs.rmdirSync(dirPath, { recursive: true });
};

export const getFileStats = (filePath: string): fs.Stats => {
   return fs.statSync(filePath);
};

export const getFileSize = (filePath: string): number => {
   return fs.statSync(filePath).size;
};

export const renameDirectory = (oldPath: string, newPath: string): void => {
   fs.renameSync(oldPath, newPath);
};

export const moveFile = (oldPath: string, newPath: string): void => {
   fs.renameSync(oldPath, newPath);
};
