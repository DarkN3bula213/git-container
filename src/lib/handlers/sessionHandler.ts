import express, { Application, NextFunction, Request, Response } from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import { config } from '../config';
import { Logger } from '../logger';
import asyncHandler from './asyncHandler';
import { clearAuthCookies } from '../utils/utils';
const logger = new Logger(__filename);

// Replace 'mongodbUri' with your MongoDB connection string
const checkSession = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.session && !req.session.id) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid, please log in again',
      });
    }
    next();
  },
);

export default async (app: Application): Promise<void> => {
  const mongodbUri = config.isDocker ? config.mongo.docker : config.mongo.dev;

  try {
    await mongoose.connect(mongodbUri);
    logger.info({
      event: ': Session DB Connected',
    });
  } catch (err) {
    logger.error({
      event: ': Session DB Connection Error',
      error: err,
    });
    // Consider exiting the application if the database connection is critical and fails
  }

  app.use(
    session({
      secret: 'vGj6GfsxRQf50DY0BK0MwC6B1fcJMfLJF4/ockgWth0=', // Ensure your secret is securely stored and not hard-coded
      resave: false,
      saveUninitialized: true,
      store: MongoStore.create({
        mongoUrl: mongodbUri,
        collectionName: 'sessions',
      }),
      cookie: {
        httpOnly: true, // Prevents client-side JS from reading the token
        secure: true, // Ensures cookie is sent over HTTPS
        sameSite: 'lax', // Important for cross-site access; use 'Strict' or 'Lax' for same-site scenarios
        maxAge: 2 * 60 * 60 * 1000, // Example: 24 hours
      },
    }),
  );

//   app.use(checkSession);
};
