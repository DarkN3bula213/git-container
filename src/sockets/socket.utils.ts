import { Logger } from '@/lib/logger';
import { createUserSession } from './session.model';
import { saveSessionQueue } from './session.queue';
const logger = new Logger(__filename);

export const handleDisconnect = async ({
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
  const saveSession = await createUserSession(userId, startTime, endTime, time);

  logger.info({
    event: 'Session Disconnet',
    user: userId,
    result: saveSession,
  });
  // saveSessionQueue.add(
  //   'saveUserSession',
  //   {
  //     userID: userId,
  //     startTime,
  //     endTime,
  //     time,
  //   },
  //   {
  //     jobId: `job-${userId}`,
  //   },
  // );
};
export function calculateTimeSpent(startTime: Date) {
  const endTime = new Date();
  const timeSpent = (endTime.getTime() - startTime.getTime()) / 1000;
  const hours = Math.floor(timeSpent / 3600);
  const minutes = Math.floor((timeSpent % 3600) / 60);
  const seconds = Math.floor(timeSpent % 60);
  const time = `${hours}h ${minutes}m ${seconds}s`;
  return {
    time,
    endTime,
    startTime,
  };
}
