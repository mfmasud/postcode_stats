import type { FastifyInstance } from "fastify"
import mongoose from "mongoose"
import { Type, type Static } from "@sinclair/typebox"

const HealthResponseSchema = Type.Object({
    status: Type.Union([Type.Literal("healthy"), Type.Literal("unhealthy")]),
    timestamp: Type.String({ format: "date-time" }),
    uptime: Type.Number({ description: "Process uptime in seconds" }),
    database: Type.Object({
        connected: Type.Boolean(),
        status: Type.String(),
    }),
})

type HealthResponse = Static<typeof HealthResponseSchema>

interface DatabaseHealth {
    connected: boolean
    status: string
}

/**
 * Health check endpoint plugin
 * Provides application health status including database connectivity
 */
async function healthRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get<{
        Reply: HealthResponse
    }>(
        "/health",
        {
            schema: {
                response: {
                    200: HealthResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const dbHealth = getDatabaseHealth()
            const isHealthy = dbHealth.connected

            const healthData: HealthResponse = {
                status: isHealthy ? "healthy" : "unhealthy",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: dbHealth,
            }

            const statusCode = isHealthy ? 200 : 503

            return reply.code(statusCode).send(healthData)
        }
    )
}

/**
 * Checks MongoDB connection health via mongoose
 * @returns Database health information
 */
function getDatabaseHealth(): DatabaseHealth {
    const readyState = mongoose.connection.readyState

    const stateMap: Record<number, string> = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
        99: "uninitialized",
    }

    return {
        connected: readyState === 1,
        status: stateMap[readyState] || "unknown",
    }
}

export default healthRoutes
