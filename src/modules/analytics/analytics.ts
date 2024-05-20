import type { Application, NextFunction, Request, Response } from 'express';
import mongoose, { model, Schema } from 'mongoose';
import type { User } from '../auth/users/user.model';

const serverActivityLogSchema = new Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  method: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    required: true,
  },
  responseTime: {
    type: Number, // in milliseconds
    required: true,
  },
  ip: {
    type: String,
    required: false,
  },
  userAgent: {
    type: String,
    required: false,
  },
  // Optionally, add more fields as needed
});

// Index to efficiently query logs by date
serverActivityLogSchema.index({ timestamp: 1 });

export const Analytics = model(
  'Analytics',
  serverActivityLogSchema,
  'analytics',
);

const silentLogs = (req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === '/login' || req.method === 'POST') {
    const start = process.hrtime();
    const user = (req.user as User) || null;
    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      const durationInMilliseconds = seconds * 1000 + nanoseconds / 1e6;

      // Assuming Analytics.create returns a Promise
      Analytics.create({
        timestamp: new Date(),
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        responseTime: durationInMilliseconds,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: user ? user._id : null,
      });
    });
  }

  next();
};

export const monitor = (app: Application) => {
  app.use(silentLogs);
};
