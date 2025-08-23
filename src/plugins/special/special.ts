import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../../../utils/logger.js';

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function specialRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {

    fastify.get('/user', UserDetails);
}

/**
 * A function which displays the details of the current user. If no user has been authenticated, a message is returned saying so.
 *
 * @function UserDetails
 *
 * @param {Object} ctx - The context for the function call, representing the request made to it.
 * @returns {undefined} ctx is modified with a 200 status code and a body representing all the user's details.
 */
function UserDetails(ctx) {
  logger.info(`UserDetails accessed from ${ctx.request.ip}`);
  const user = ctx.state.user;

  if (!user) {
    logger.info(`User not logged in`);
    ctx.throw(401, "No user details available. Please log in to see them.");
    return;
  }

  logger.info(`Details returned for User "${user.username}" in message body.`);
  ctx.status = 200;
  ctx.body = {
    user,
  };
}


export default specialRoutes;
