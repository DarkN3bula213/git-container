import asyncHandler from '@/lib/handlers/asyncHandler';
import { verifyToken } from '@/lib/utils/tokens';



export const authentication = asyncHandler(async (req, res, next) => {

  try {
 
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
