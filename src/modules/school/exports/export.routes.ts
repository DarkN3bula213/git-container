import { setRouter } from '@/lib/utils/utils';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import { getXlsxResults } from './export.controller';

const router = Router();

const getExportRoutes = (): RouteMap[] => {
	return [
		{
			path: '/students',
			method: 'get',
			handler: getXlsxResults
		}
	];
};

setRouter(router, getExportRoutes());

export default router;
