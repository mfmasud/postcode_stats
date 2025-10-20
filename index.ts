import dotenv from "dotenv"
dotenv.config()

import logger from "./src/utils/logger.js"
import buildServer from "./app.js"

const server = await buildServer()
const port = parseInt(process.env.PORT || "8080")

/**
 * Starts the Fastify server with plugins loaded.
 * @param port The port to listen on for incoming requests.
 */
async function startServer(port: number) {
    console.log("Starting server on port", port)
    try {
        // start Fastify server
        const address = await server.listen({ port, host: "0.0.0.0" })
        logger.info(`Server listening at ${address}`)

        // graceful shutdown - https://thatarif.in/posts/token-based-authentication-with-fastify-jwt
        const listeners = ["SIGINT", "SIGTERM"]
        listeners.forEach((signal) => {
            process.on(signal, async () => {
                await server.close()
                process.exit(0)
            })
        })
    } catch (err) {
        logger.error(err)
        process.exit(1)
    }
}

export default startServer(port)
