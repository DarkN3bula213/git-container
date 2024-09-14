import { Logger } from '@/lib/logger';
import mongoose, { type ClientSession } from 'mongoose';

type TransactionCallback<T> = (session: ClientSession) => Promise<T>;
const logger = new Logger(__filename);

export async function withTransaction<T>(
   callback: TransactionCallback<T>
): Promise<T> {
   const session = await mongoose.startSession();
   session.startTransaction();

   try {
      const result = await callback(session);
      logger.info('Transaction Success');

      await session.commitTransaction();
      return result;
   } catch (error) {
      await session.abortTransaction();
      throw error;
   } finally {
      session.endSession();
   }
}

/**
  public async handleIssueReply(
    parentIssueId: string,
    replyId: string
  ): Promise<void> {
    await withTransaction(async (session) => {
      // Get the parent issue by ID within the transaction
      await this.getIssueById(parentIssueId, session);

      // Call the updateIssueWithReply method within the transaction
      await this.updateIssueWithReply(parentIssueId, replyId, session);
    });
*/
