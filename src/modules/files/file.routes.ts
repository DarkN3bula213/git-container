import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import * as controller from './files.controller';
import { supaUpload } from '@/lib/config/multer';
import { setRouter } from '@/lib/utils/utils';
import * as multer from './multer.controller';

const router = Router();
// router.post('/upload', upload.single('file'), controller.handleFileUpload);

const getRoutes = (): RouteMap[] => {
    return [
        {
            path: '/download/:filename',
            method: 'get',
            //   validations: [authentication],
            handler: controller.downloadFile
        },
        {
            path: '/file',
            method: 'get',
            handler: controller.getFiles
        },
        {
            path: '/file/upload',
            method: 'post',
            handler: controller.uploadDocument,
            validations: [supaUpload.single('myFile')]
        },
        {
            path: '/file/:filename',
            method: 'delete',
            handler: controller.deleteFile
        },
        {
            path: '/multer/upload',
            method: 'post',
            handler: multer.uploadFile
        },
        {
            path: '/multer/download/:folder/:fileName',
            method: 'get',
            handler: multer.downloadFile
        },
        {
            path: '/multer',
            method: 'get',
            handler: multer.listFiles
        },
        {
            path: '/multer/:folder/:fileName',
            method: 'delete',
            handler: multer.deleteFile
        },
        {
            path: '/multer/docs',
            method: 'post',
            handler: multer.uploadDocument
        }
    ];
};

setRouter(router, getRoutes());

export default router;
