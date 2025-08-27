import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { LoginUserJWT } from './authhelper.js';
import fp from 'fastify-plugin';
import logger from '../../utils/logger.js';
import type { Static } from '@sinclair/typebox';
import { LoginRouteSchema, LoginQuerySchema } from '../../schemas/auth.js';

/**
 * Authentication routes plugin
 * Provides /login endpoint
 */
async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  /**
   * Login route - generates JWT token for a given user ID
   * GET /login?id=<user_id>
   */
  fastify.get<{ Querystring: Static<typeof LoginQuerySchema> }>('/login', {
    schema: LoginRouteSchema
  }, GetJWTfromID);
}

async function GetJWTfromID (request: FastifyRequest<{ Querystring: Static<typeof LoginQuerySchema> }>, reply: FastifyReply) {
  const { id } = request.query;

  if (!id) {
    logger.info('No user ID provided');
    return reply.code(400).send({
      error: 'Bad Request',
      message: 'User ID is required'
    });
  }

  logger.info(`GetJWTfromID accessed from ${request.ip} for user id ${id}`);
  
  try {
    const token = await LoginUserJWT(reply, id);
    logger.info('Token generated and returned in response body.');
    return reply.code(200).send({
      jwt: token
    });
    
  } catch (error: any) {
    logger.error(`Error during login: ${error.message}`);
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Failed to process login request'
    });
  }
}

export default fp(authRoutes, {
  name: 'auth-routes',
  dependencies: ['jwt-plugin'] // Ensure JWT plugin is loaded first
});