import fp from "fastify-plugin"
import {
    connectDB,
    initUserDB,
    resetDataDB,
    //initLocationDB,
    disconnectDB,
} from "../../helpers/database.js"
import type { FastifyInstance } from "fastify"

export default fp(async (fastify: FastifyInstance) => {
    await connectDB(true)
    await initUserDB()
    await resetDataDB()
    //await initLocationDB();

    fastify.log.info("✅ Databases initialised")

    fastify.addHook("onClose", async () => {
        fastify.log.info("🛑 Closing DB connections...")
        await disconnectDB(true)
    })
})
