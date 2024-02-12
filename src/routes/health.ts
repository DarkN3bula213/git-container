import { Request, Response } from 'express';
export async function health(req: Request, res: Response) {
 
  res.status(200).json({
    message: 'success',
  });
}
