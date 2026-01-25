import fp from "fastify-plugin"
import {
    connectDB,
    resetDataDB,
    disconnectDB,
} from "../../helpers/database.js"
import type { FastifyInstance } from "fastify"

import logger from "../../utils/logger.js"

export default fp(async (fastify: FastifyInstance) => {
    try {
        await connectDB(true)
        await resetDataDB()

        logger.info("Databases initialised")
    } catch (error) {
        logger.warn(
            `Database initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`
        )
        logger.warn("Continuing without database connection...")
    } finally {
        fastify.addHook("onClose", async () => {
            logger.info("Closing DB connections...")
            await disconnectDB(true)
        })
    }
})
