import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
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

export default specialRoutes;
