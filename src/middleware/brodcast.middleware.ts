import { Request, Response, NextFunction } from 'express';
import { socketService } from '../';
import { Key } from '@/data/cache/keys';
import asyncHandler from '@/lib/handlers/asyncHandler';
import { cache } from '@/data/cache/cache.service';
const broadcast = (eventName: string, getMessage: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        res.on('finish', async () => {
            try {
                // Await the message if it's a promise (for async work)
                const message = await Promise.resolve(getMessage(req, res));

                // Broadcast the event and message to all clients
                socketService.broadcast(eventName, message);

                console.log(`Successfully broadcasted event: ${eventName}`);
            } catch (error) {
                console.error(`Error broadcasting event ${eventName}:`, error);
            }
        });

        // Proceed to the next middleware/route handler
        next();
    };
};

export default broadcast;
export const notifyRevenueChange = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const key = Key.DAILYTOTAL;
        const totalAmount = await cache.get<number>(key);

        return {
            message: `Total revenue for today changed to $${totalAmount}`,
            timestamp: new Date().toISOString()
        };
    }
);
