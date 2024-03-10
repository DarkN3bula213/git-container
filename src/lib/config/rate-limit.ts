
import { Logger } from '@/lib/logger';
const logger = new Logger(__filename);
import rateLimit from 'express-rate-limit';


export const options = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes',
 

  headers: true,
};

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 25, // Limit each IP to 5 login requests per `window` per minute
  message: {
    message:
      'Too many login attempts from this IP, please try again after a 60 second pause',
  },
  handler: (req, res, next, options) => {
      logger.debug({
        message: 'Too many login attempts from this IP, please try again after a 60 second pause',
        options: options
   })
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});