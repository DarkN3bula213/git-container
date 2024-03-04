import { CookieOptions } from "express";




export const options:CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 2 * 60 * 60 * 1000,
    domain: '.hps-admin.com',
}


