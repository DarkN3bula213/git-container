import asyncHandler from '@/lib/handlers/asyncHandler';
import { verifyToken } from '@/lib/utils/tokens';
import {Logger } from "@/lib/logger/logger"


export const authentication = asyncHandler(async (req, res, next) => {
  const logger= new Logger(__filename)
  try {
    logger.debug({
      tokens: JSON.stringify(req),
    })
    const token = req.cookies.access; // Assuming token is stored in cookie named 'access'
    if (!token) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { decoded, valid } = verifyToken(token, 'access');

    if (!valid) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = decoded?.user;  
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});
