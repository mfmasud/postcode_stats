import type { FastifyReply } from "fastify";
import User from "../../models/User.js";
import logger from "../../utils/logger.js";

/**
 * Generates a JWT token for a given user id by performing a DB lookup
 * and delegating token signing to the Fastify JWT plugin.
 *
 * @param fastify - Fastify instance providing the JWT generator
 * @param id - Public user id to look up
 * @returns The signed JWT token string
 */
export async function LoginUserJWT(reply: FastifyReply, id: string) {

    logger.info(`loginUserJWT generating JWT token for user id ${id}`);
    const user = await User.findOne({ id });

    if (!user) {
        logger.info(`User not found`);
        reply.code(401).send({
            error: 'Unauthorized',
            message: 'User not found'
        });
        return;
    }
    //logger.info(`User found ${JSON.stringify(user)}`);
    const token = await reply.server.generateToken(reply, user._id.toString());

    logger.info(`Token generated for User "${user.username}"`);
    return token;
}
