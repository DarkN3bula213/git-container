import { Request, Router, Response } from 'express';

const router = Router();
router.get('/', health);
// export default (): Router => {
//   return router;
// };

async function health(req: Request, res: Response) {
  res.status(200).json({
    message: 'success',
  });
}

export default router;
