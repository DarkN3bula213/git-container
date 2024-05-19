import type { CookieOptions } from 'express';
import { convertToMilliseconds } from '../utils/fns';
import { config } from './config';

export const accessCookie: CookieOptions = {
  httpOnly: !config.isDevelopment,
  secure: !config.isDevelopment,
  sameSite: 'strict',
  path: '/',
  // domain: !config.isDevelopment ? '.hps-admin.com' : '',
  maxAge: convertToMilliseconds('2h'),
};

export const logoutCookie: CookieOptions = {
  httpOnly: !config.isDevelopment,
  secure: !config.isDevelopment,
  sameSite: 'strict',
  path: '/',
  // domain: !config.isDevelopment ? '.hps-admin.com' : '',
  maxAge: -1,
};
