import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../../utils/logger.js';

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function rootRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {

    fastify.get('/', async (request: FastifyRequest) => {
      return Welcome(request);
    });
}

// This function is independent of Fastify's route registration
export function Welcome(request: FastifyRequest) {
    logger.info(
      `Incoming ${request.method} request from ${request.ip} to ${request.headers.host}${request.url}`
    );
  
    return {
      message: 'Hello and welcome to the UK Location API!',
    };
  }

export default rootRoutes;