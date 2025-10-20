import type { FastifyInstance } from "fastify"

/**
 * @param {FastifyInstance} fastify
 */
async function rootRoutes(fastify: FastifyInstance) {
    fastify.get("/", async () => {
        return Welcome()
    })
}

// This function is independent of Fastify's route registration
export function Welcome() {
    return {
        message: "Hello and welcome to the UK Location API!",
    }
}

export default rootRoutes
