import fp from "fastify-plugin";
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import type { AuthUser } from '../../models/User.js';

import User from '../../models/User.js';

import logger from '../../utils/logger.js';

type JwtDecodedPayload = { _id?: string };

// TypeScript declaration merging for FastifyJWT interface
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { _id: string };
  }
}

/**
 * JWT plugin for Fastify
 * Provides JWT authentication functionality including token generation and verification
 * Following @fastify/jwt best practices with enhanced security features
 */
async function jwtPlugin(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // Validate JWT secret
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
  }

  // Register @fastify/jwt plugin with proper configuration
  await fastify.register(import("@fastify/jwt"), { 
    secret: jwtSecret,
    sign: {
      algorithm: 'HS256',
      expiresIn: '1h',
      iss: 'postcode-stats-api', // Add issuer for better security
      aud: 'postcode-stats-app'  // Add audience for better security
    },
    verify: {
      algorithms: ['HS256'],
      allowedIss: 'postcode-stats-api',
      allowedAud: 'postcode-stats-app',
      clockTolerance: 10 // Allow 10 seconds clock skew
    }
  });

  // Decorate request with authUser holder to avoid clashing with fastify-jwt's request.user
  fastify.decorateRequest('authUser', null);

  /**
   * Generates a JWT token for a provided user id using reply.jwtSign()
   * Following @fastify/jwt best practices
   * 
   * @param {FastifyReply} reply - The Fastify reply object
   * @param {string} userId - The raw user id (_id) to generate a token for
   * @returns {Promise<string>} - The generated JWT token
   */
  async function generateToken(reply: FastifyReply, userId: string): Promise<string> {
    const payload = { 
      _id: userId
    };
    
    return reply.jwtSign(payload);
  }

  /**
   * Verifies JWT token and populates request.authUser with authenticated user data
   */
  async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Verify JWT token using @fastify/jwt
      const payload = await request.jwtVerify<{ _id: string }>();
      
      if (!payload || !payload._id) {
        logger.info('Invalid JWT payload: missing _id');
        throw new Error('Invalid token payload');
      }

      logger.info(`Verifying token _id [${payload._id}]`);

      // Look up user in database and populate role, then lean to a plain object
      const user = await User.findById(payload._id)
        .populate('role')
        .lean<AuthUser>()
        .exec();
      
      if (!user) {
        logger.info(`User with _id [${payload._id}] not found`);
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'User not found'
        });
      }

      // Attach verified user to request object under authUser
      request.authUser = user;

      logger.info(`Successfully verified user ${user.username}`);
      
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      logger.error(`Authentication failed: ${err?.message ?? 'Unknown error'}`);
      
      // Handle specific @fastify/jwt errors with proper status codes
      const errorResponses = {
        'FAST_JWT_INVALID_SIGNATURE': {
          code: 401,
          error: 'Unauthorized',
          message: 'Invalid token signature'
        },
        'FAST_JWT_EXPIRED': {
          code: 401,
          error: 'Unauthorized',
          message: 'Authorization token expired'
        },
        'FST_JWT_NO_AUTHORIZATION_IN_HEADER': {
          code: 401,
          error: 'Unauthorized',
          message: 'No Authorization was found in request.headers'
        },
        'FST_JWT_BAD_REQUEST': {
          code: 400,
          error: 'Bad Request', 
          message: 'Format is Authorization: Bearer [token]'
        },
        'FAST_JWT_INVALID_AUDIENCE': {
          code: 401,
          error: 'Unauthorized',
          message: 'Invalid token audience'
        },
        'FAST_JWT_INVALID_ISSUER': {
          code: 401,
          error: 'Unauthorized',
          message: 'Invalid token issuer'
        },
        'FAST_JWT_MALFORMED': {
          code: 400,
          error: 'Bad Request', 
          message: 'Malformed JWT token'
        }
      } as const;

      const errorResponse = errorResponses[(err?.code ?? '') as keyof typeof errorResponses];
      if (errorResponse) {
        return reply.code(errorResponse.code).send({
          error: errorResponse.error,
          message: errorResponse.message
        });
      }
      
      // Generic authentication failure
      return reply.code(401).send({
        error: 'Unauthorized',
        message: `Authentication failed - ${err?.message ?? 'Unknown error'}`
      });
    }
  }

  /**
   * Utility function to decode JWT without verification (for debugging/logging)
   * 
   * @param {FastifyRequest} request - The Fastify request object
   * @returns {Promise<JwtDecodedPayload>} - The decoded payload (unverified)
   */
  async function decodeToken(request: FastifyRequest): Promise<JwtDecodedPayload> {
    try {
      return request.jwtDecode() as JwtDecodedPayload;
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error(`Token decode failed: ${err?.message ?? 'Unknown error'}`);
      throw error;
    }
  }

  // Decorate fastify instance with improved functions
  fastify.decorate("generateToken", generateToken);
  fastify.decorate("authenticate", authenticate);
  fastify.decorate("decodeToken", decodeToken);
}

// Extend Fastify types to include new decorators with proper typing
declare module 'fastify' {
  interface FastifyInstance {
    generateToken: (reply: FastifyReply, userId: string) => Promise<string>;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    decodeToken: (request: FastifyRequest) => Promise<JwtDecodedPayload>;
  }
  interface FastifyRequest {
    authUser: AuthUser | null;
  }
}

export default fp(jwtPlugin, {
  name: 'jwt-plugin',
  dependencies: []
});