import fp from 'fastify-plugin';
import logger from '../../utils/logger.js';

import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { LoginUserJWT } from './authhelper.js';
import { LoginRouteSchema } from '../../schemas/authSchema.js';

/**
 * Authentication routes plugin
 * Provides /login endpoint
 */
const authRoutes: FastifyPluginAsyncTypebox = async(fastify) => {
  /**
   * Login route - generates JWT token for a given user ID
   * GET /login?id=<user_id>
   */
  fastify.get('/login', {
    schema: LoginRouteSchema
  }, async (request, reply) => {
    const { id } = request.query;

    logger.info(`GetJWTfromID accessed from ${request.ip} for user id ${id}`);

    try {
      if (!id) {
        reply.code(400).send({
          error: 'Bad Request',
          message: 'Query parameter id is required'
        });
        return;
      }

      const token = await LoginUserJWT(reply, id);

      if (typeof token !== 'string') {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Failed to generate token'
        });
        return;
      }

      logger.info('Token generated and returned in response body.');
      reply.code(200).send({
        jwt: token
      });
      return;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error during login: ${message}`);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to process login request'
      });
      return;
    }
  });
};

export default fp(authRoutes, {
  name: 'auth-routes',
  dependencies: ['jwt-plugin'] // Ensure JWT plugin is loaded first
});