import { Router } from 'express';
import * as controller from './file.controller';
import { RouteMap } from '@/types/routes';
import { setRouter } from '@/lib/utils/utils';

const router = Router();

const getRoutes = (): RouteMap[] => {
  return [
    {
      path: '/upload',
      method: 'post',
      handler: controller.uploadFile,
    },
    {
      path: '/download',
      method: 'get',
      handler: controller.downloadFile,
    },
    {
      path: '/delete',
      method: 'delete',
      handler: controller.deleteFile,
    },
  ];
};

setRouter(router,getRoutes())

export default router;
