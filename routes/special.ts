import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function specialRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {

    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        console.log(
          `Incoming ${request.method} request from ${request.socket.remoteAddress} to ${request.headers.host}${request.url}`
        );
        return {
          message: "Hello and welcome to the UK Location API!",
        };
    });
}

export default specialRoutes;
