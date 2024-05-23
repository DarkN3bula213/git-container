import { Logger } from '@/lib/logger';
import { saveSessionQueue } from './session.queue';
const logger = new Logger(__filename);

export const handleDisconnect = ({
  userId,
  startTime,
}: {
  userId: string;
  startTime: Date;
}) => {
  const endTime = new Date();
  const timeSpent = (endTime.getTime() - startTime.getTime()) / 1000;
  const hours = Math.floor(timeSpent / 3600);
  const minutes = Math.floor((timeSpent % 3600) / 60);
  const seconds = Math.floor(timeSpent % 60);
  const time = `${hours}h ${minutes}m ${seconds}s`;

  logger.info({
    event: 'User disconnected',
    userID: userId,
    timeSpent: time,
  });
  saveSessionQueue.add('saveUserSession', {
    userID: userId,
    startTime,
    endTime,
    time,
  });
};
