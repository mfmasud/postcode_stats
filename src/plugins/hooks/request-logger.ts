import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import logger from '../../utils/logger.js';

async function requestLoggerPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('correlationId', '');

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const headerValue = request.headers['x-request-id'];
    const headerId = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const correlationId = typeof headerId === 'string' && headerId.length > 0 ? headerId : randomUUID();

    request.correlationId = correlationId;
    reply.header('x-request-id', correlationId);

    const host = request.headers.host ?? '';
    logger.info(
      `[${correlationId}] ${request.ip} -> ${request.method} REQUEST -> ${host}${request.url}`
    );
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const correlationId = request.correlationId;
    const host = request.headers.host ?? '';
    logger.info(
      `[${correlationId}] ${request.method} -> ${host}${request.url} -> ${reply.statusCode} RESPONSE`
    );
  });
}

export default fp(requestLoggerPlugin, {
  name: 'requestLoggerPlugin'
});

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string;
  }
} 