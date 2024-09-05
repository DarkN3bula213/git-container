import type { CookieOptions } from 'express';
import { convertToMilliseconds } from '../utils/fns';
import { config } from './config';

export const accessCookie: CookieOptions = {
  httpOnly: !config.isDevelopment,
  secure: !config.isDevelopment,
  // sameSite: 'strict',
  path: '/',
  maxAge: convertToMilliseconds('2h'),
};

export const logoutCookie: CookieOptions = {
  httpOnly: !config.isDevelopment,
  secure: !config.isDevelopment,
  sameSite: 'strict',
  path: '/',
  maxAge: -1,
};

export const sessionCookie: CookieOptions = {
  httpOnly: !config.isDevelopment,
  secure: !config.isDevelopment,
  sameSite: 'strict',
  path: '/',
  maxAge: convertToMilliseconds('2h'),
};
