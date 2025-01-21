import { setRouter } from '@/lib/utils/utils';
import { RouteMap } from '@/types/routes';
import { Router } from 'express';
import multer from 'multer';
import { postFeedback } from './feedback.controller';

const dir = `${process.cwd()}/uploads/feedback/`;

const multerConfig = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, dir);
		},
		filename: (req, file, cb) => {
			cb(null, `${Date.now()}-${file.originalname}`);
		}
	})
});

export const getFeedbackRoutes = (): RouteMap[] => {
	return [
		{
			method: 'post',
			path: '/',
			handler: postFeedback,
			validations: [multerConfig.single('attachment')]
		}
	];
};
const router = Router();

setRouter(router, getFeedbackRoutes());

export default router;
