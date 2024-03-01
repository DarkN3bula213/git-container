import { config } from '@/lib/config';
import { Request, Response } from 'express';
export async function health(req: Request, res: Response) {
  res.setHeader('set-cookie', 'test=test; Secure; SameSite=None; HttpOnly;');
  res.cookie('Success Cookie', config.tokens.refresh.public, {
    secure: false,
    sameSite: 'lax',
    httpOnly: false,

    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
  res.status(200).json({
    message: 'success',
  });
}
