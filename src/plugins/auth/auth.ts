import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { LoginUserJWT } from './authhelper.js';
import fp from 'fastify-plugin';
import logger from '../../utils/logger.js';

// Interface for login query parameters
interface LoginQuery {
  id?: string;
}

/**
 * Authentication routes plugin
 * Provides /login endpoint
 */
async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  /**
   * Login route - generates JWT token for a given user ID
   * GET /login?id=<user_id>
   */
  fastify.get<{ Querystring: LoginQuery }>('/login', {
    schema: {
      querystring: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            jwt: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, GetJWTfromID);
}

async function GetJWTfromID (request: FastifyRequest<{ Querystring: LoginQuery }>, reply: FastifyReply) {
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