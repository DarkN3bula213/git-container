import { Request, Response } from 'express';

export async function health(_req: Request, res: Response) {
	res.send('OK');
}
