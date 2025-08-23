import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import type { AuthenticatedUser } from './authhelper.js';
import fp from 'fastify-plugin';

import User from '../../../models/User.js';
import Role from '../../../models/Role.js';
import { type UserDoc } from '../../../models/User.js';
import { type RoleDoc } from '../../../models/Role.js';
import logger from '../../../utils/logger.js';

// Interface for login query parameters
interface LoginQuery {
  id?: string;
}

/**
 * Authentication routes plugin
 * Provides /login and /private endpoints
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
  }, async (request: FastifyRequest<{ Querystring: LoginQuery }>, reply: FastifyReply) => {
    const { id } = request.query;
    
    logger.info(`loginUserJWT accessed from ${request.ip} for user id ${id}`);
    
    if (!id) {
      logger.info('No user ID provided');
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'User ID is required'
      });
    }

    try {
      const user = await User.findOne({ id });

      if (!user) {
        logger.info(`User not found for id: ${id}`);
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'User not found'
        });
      }

      // Generate token using improved Fastify JWT plugin
      const token = await fastify.generateToken(reply, user);

      logger.info(`Token generated for User "${user.username}" in message body.`);
      
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
  });

  /**
   * Private route - returns authenticated user details
   * GET /private
   * Requires: Authorization: Bearer <jwt_token>
   */
  fastify.get('/private', {
    preHandler: [fastify.authenticate],
    schema: {
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                username: { type: 'string' },
                id: { type: 'string' },
                role: { 
                  type: 'object',
                  additionalProperties: true
                }
              },
              required: ['_id', 'username', 'id']
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    logger.info(`UserDetails accessed from ${request.ip}`);
    
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      logger.info(`User not logged in - this should not happen if authenticate preHandler works correctly`);
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'No user details available. Please log in to see them.'
      });
    }

    logger.info(`Details returned for User "${user.username}" in message body.`);
    
    return reply.code(200).send({
      user: {
        _id: user._id,
        username: user.username,
        id: user.id,
        role: user.role
      }
    });
  });
}

export default fp(authRoutes, {
  name: 'auth-routes',
  dependencies: ['jwt-plugin'] // Ensure JWT plugin is loaded first
});