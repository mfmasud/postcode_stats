import fp from "fastify-plugin";
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import type { UserDoc } from '../../../models/User.js';
import type { RoleDoc } from '../../../models/Role.js';

import User from '../../../models/User.js';
import Role from '../../../models/Role.js';

import logger from '../../../utils/logger.js';

// Interface for user with populated role
interface PopulatedUserDoc extends Omit<UserDoc, 'role'> {
  role: RoleDoc;
}

// TypeScript declaration merging for FastifyJWT interface
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { _id: string; iat?: number; exp?: number }; // payload type is used for signing and verifying
    user: {
      _id: string;
      username: string;
      id: string;
      role?: RoleDoc;
    }; // user type is return type of `request.user` object
  }
}

// Interface for JWT options that can be passed to token generation
interface TokenOptions {
  expiresIn?: string | number;
  audience?: string | string[];
  issuer?: string;
  subject?: string;
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

  /**
   * Generates a JWT token for the given user using reply.jwtSign()
   * Following @fastify/jwt best practices
   * 
   * @param {FastifyReply} reply - The Fastify reply object
   * @param {UserDoc} user - The user object to generate a token for
   * @param {TokenOptions} options - Optional token signing options
   * @returns {Promise<string>} - The generated JWT token
   */
  async function generateToken(reply: FastifyReply, user: UserDoc, options?: TokenOptions): Promise<string> {
    const payload = { 
      _id: user._id.toString(),
      // Add user context for better security
      username: user.username
    };
    
    // Merge default options with provided options
    const signOptions = {
      ...(options || {}),
      // Always include these for security
      jti: `${user._id}-${Date.now()}`, // JWT ID for tracking
      sub: user._id.toString() // Subject
    };
    
    return reply.jwtSign(payload, signOptions);
  }

  /**
   * Enhanced authentication decorator function
   * Verifies JWT token and populates request.user with authenticated user data
   */
  async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Verify JWT token using @fastify/jwt
      const payload = await request.jwtVerify() as { _id: string; iat?: number; exp?: number; jti?: string };
      
      if (!payload || !payload._id) {
        logger.info('Invalid JWT payload: missing _id');
        throw new Error('Invalid token payload');
      }

      // Add security check for token age (optional)
      if (payload.iat && payload.exp) {
        const tokenAge = Date.now() / 1000 - payload.iat;
        const maxAge = 24 * 60 * 60; // 24 hours max
        if (tokenAge > maxAge) {
          logger.info(`Token too old: ${tokenAge} seconds`);
          throw new Error('Token expired due to age');
        }
      }

      logger.info(`Verifying token _id [${payload._id}]${payload.jti ? ` with JTI [${payload.jti}]` : ''}`);

      // Look up user in database and populate role with proper typing
      const user = await User.findById(payload._id).populate<{ role: RoleDoc }>('role') as PopulatedUserDoc | null;
      
      if (!user) {
        logger.info(`User with _id [${payload._id}] not found`);
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'User not found'
        });
      }

      // Attach verified user to request object with proper typing
      request.user = {
        _id: user._id.toString(),
        username: user.username,
        role: user.role,
        id: user.id || user._id.toString()
      };

      logger.info(`Successfully verified user ${user.username}`);
      
    } catch (error: any) {
      logger.error(`Authentication failed: ${error.message}`);
      
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
      };

      const errorResponse = errorResponses[error.code as keyof typeof errorResponses];
      if (errorResponse) {
        return reply.code(errorResponse.code).send({
          error: errorResponse.error,
          message: errorResponse.message
        });
      }
      
      // Generic authentication failure
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication failed'
      });
    }
  }

  /**
   * Utility function to decode JWT without verification (for debugging/logging)
   * 
   * @param {FastifyRequest} request - The Fastify request object
   * @returns {Promise<any>} - The decoded payload (unverified)
   */
  async function decodeToken(request: FastifyRequest): Promise<any> {
    try {
      return await request.jwtDecode();
    } catch (error: any) {
      logger.error(`Token decode failed: ${error.message}`);
      throw error;
    }
  }

  // Decorate fastify instance with improved functions
  fastify.decorate("generateToken", generateToken);
  fastify.decorate("authenticate", authenticate);
  fastify.decorate("decodeToken", decodeToken);
}

// Extend FastifyInstance to include new decorators with proper typing
declare module 'fastify' {
  interface FastifyInstance {
    generateToken: (reply: FastifyReply, user: UserDoc, options?: TokenOptions) => Promise<string>;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    decodeToken: (request: FastifyRequest) => Promise<any>;
  }
}

export default fp(jwtPlugin, {
  name: 'jwt-plugin',
  dependencies: []
});

export type { TokenOptions };