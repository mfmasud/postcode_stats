// Test autoload plugin and fp-style export

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';

async function exampleRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.get(`/example`, async (request, reply) => {
        return { message: 'Hello, world!' };
    });
}

export default fp(exampleRoutes, {
    name: 'exampleRoutes'
});
