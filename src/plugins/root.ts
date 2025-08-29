import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';

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
    return {
      message: 'Hello and welcome to the UK Location API!',
    };
  }

export default rootRoutes;