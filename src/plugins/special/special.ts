import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import { UserDetails } from './specialhelper.js';

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function specialRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get('/private', {
    preHandler: [fastify.authenticate],
  }, UserDetails);
}

export default fp(specialRoutes, {
  name: 'special-routes',
  dependencies: ['jwt-plugin']
});
