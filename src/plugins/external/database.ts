import fp from "fastify-plugin"
import type { FastifyInstance } from "fastify"

import {
    connectDB,
    disconnectDB,
} from "../../helpers/database.js"

export default fp(async (fastify: FastifyInstance) => {
    await connectDB(true)

    fastify.addHook("onClose", async () => {
        await disconnectDB(true)
    })
})
