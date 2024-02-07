import { Request, Router, Response } from 'express';

const router = Router();
router.get('/', async (req: Request, res: Response) => {
  res.status(200).json({
    message: 'success',
  });
});
export default (): Router => {
  return router;
};
