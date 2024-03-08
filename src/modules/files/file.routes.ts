import { RouteMap } from "@/types/routes";
import { Router } from "express";
import * as controller from "./files.controller";
import { supaUpload } from "@/lib/config/multer";
import { setRouter } from "@/lib/utils/utils";

const router = Router()
// router.post('/upload', upload.single('file'), controller.handleFileUpload);

const getRoutes = (): RouteMap[] => {
  return [
    {
      path: '/download/:filename',
      method: 'get',
      //   validations: [authentication],
      handler: controller.downloadFile,
    },
    {
      path: '/file',
      method: 'get',
      handler: controller.getFiles,
    },
    {
      path: '/file/upload',
      method: 'post',
      handler: controller.uploadDocument,
      validations: [supaUpload.single('myFile')],
    },
    {
      path: '/file/:filename',
      method: 'delete',
      handler: controller.deleteFile,
    },
  ];
};

setRouter(router, getRoutes());

export default router;
