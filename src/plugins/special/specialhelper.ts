import type { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../../../utils/logger.js';

export interface UserOut {
    username: string;
    id: string;
}

// Extend FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: UserOut;
  }
}

export async function addUser(request: FastifyRequest): Promise<void> {
  // mock data - simulates a user being authenticated and added to the request object
  const token = 1
  
  if (token) {
    // Mock user data
    request.user = {
      username: "John Doe",
      id: "user123"
    };
  }
}

/**
 * A function which displays the details of the current user. If no user has been authenticated, a message is returned saying so.
 *
 * @function UserDetails
 *
 * @param {FastifyRequest} request - The context for the function call, representing the request made to it.
 */
export async function UserDetails(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = request.user;
  
  logger.info(`UserDetails accessed from ${request.ip}`);
  //logger.info(user);

  if (!user) {
    logger.info(`User not logged in`);
    reply.status(401).send("No user details available. Please log in to see them.");
    return;
  }

  logger.info(`Details returned for User "${user.username}" in message body.`);
  reply.status(200).send({ user });
}
 