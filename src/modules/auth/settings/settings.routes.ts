import { setRouter } from '@/lib/utils/utils';
import { authentication } from '@/middleware/authMiddleware';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import { updateSetting } from './setting.controller';

// import schema from './setting.schema';

const router = Router();
const getRoutes = (): RouteMap[] => {
	return [
		{
			path: '/',
			method: 'put',
			validations: [authentication],
			handler: updateSetting
		}
	];
};

setRouter(router, getRoutes());
export default router;
