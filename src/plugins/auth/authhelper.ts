import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { type RoleDoc } from '../../../models/Role.js';

// Interface for authenticated user data
export interface AuthenticatedUser {
  _id: string;
  username: string;
  role?: RoleDoc;
  id?: string;
}

/**
 * Auth helper plugin for Fastify
 * This plugin now simply provides TypeScript interfaces and extends request type
 * The actual JWT functionality is handled by the main JWT plugin
 */
async function authPlugin(fastify: FastifyInstance) {
  // No implementation needed - JWT registration and authentication
  // is now handled by the main JWT plugin in src/plugins/external/fastify-jwt.ts
}

export default fp(authPlugin, {
  name: 'auth-helper',
  dependencies: ['jwt-plugin'] // Ensure JWT plugin is loaded first
});
