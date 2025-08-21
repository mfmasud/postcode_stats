import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger.js';

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function specialRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {

    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        logger.info(
          `Incoming ${request.method} request from ${request.socket.remoteAddress} to ${request.headers.host}${request.url}`
        );
        return {
          message: "Hello and welcome to the UK Location API!",
        };
    });
}

export default specialRoutes;
