import { Request, Response } from 'express';
export async function health(req: Request, res: Response) {
  res.send('OK');
}
