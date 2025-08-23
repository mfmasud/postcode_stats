import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { addUser, UserDetails } from './specialhelper.js';

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function specialRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
    fastify.get('/user', {
        preHandler: [addUser],
    }, UserDetails);
}

export default specialRoutes;
