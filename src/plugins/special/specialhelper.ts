import type { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../../../utils/logger.js';

/**
 * A function which displays the details of the current user. If no user has been authenticated, a message is returned saying so.
 *
 * @function UserDetails
 *
 * @param {FastifyRequest} request - The context for the function call, representing the request made to it.
 */
export async function UserDetails(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = request.authUser;
  
  logger.info(`UserDetails accessed from ${request.ip}`);
  //logger.info(user);

  if (!user) {
    logger.info('User not logged in');
    reply.status(401).send({ error: 'Unauthorized', message: 'No user details available. Please log in to see them.' });
    return;
  }

  logger.info(`Details returned for User "${user.username}" in message body.`);
  reply.status(200).send({ user });
}
 