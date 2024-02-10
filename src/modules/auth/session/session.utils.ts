import { signToken, verifyToken } from '@/lib/utils/tokens';
import { get } from 'lodash';
import sessionModel from './session.model';
import { config } from '@/lib/config';
import { findUserById } from '../users/user.model';
import { Logger } from '@/lib/logger';

const logger = new Logger(__filename)
export async function reIssueAccessToken({
  refreshToken,
}: {
  refreshToken: string;
}) {
  const { decoded } = verifyToken(refreshToken, 'refresh');

  if (decoded && decoded.user) {
    const verifiyUser = await findUserById(decoded.user._id);
    if (!verifiyUser) {
      logger.debug('User not found');
      return false;
    }

    const accessToken = signToken(
      { user: verifiyUser },
      'access',
      { expiresIn: config.tokens.access.ttl }, // 15 minutes
    );
    logger.debug('Access token created');
    return accessToken;
  }

  if (!decoded || !get(decoded, 'session')) {
    logger.debug('Invalid token or session');
    return false;
  }

  const session = await sessionModel.findById(get(decoded, 'session'));

  if (!session || !session.valid) {
    logger.debug('Invalid session');
    return false;
  }

  const user = await findUserById(session.user);

  if (!user) {
    logger.debug('User not found');
    return false;
  }

  const accessToken = signToken(
    { user, session: session._id },
    'access',
    { expiresIn: config.tokens.access.ttl }, // 15 minutes
  );
  logger.debug('Access token created');
  return accessToken;
}
