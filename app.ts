import fastify, { type FastifyInstance } from "fastify"
import autoLoad from "@fastify/autoload"
import {
    TypeBoxValidatorCompiler,
    type TypeBoxTypeProvider,
} from "@fastify/type-provider-typebox"

import { apiPrefix } from "./src/config/global.js"
import logger from "./src/utils/logger.js"

import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function buildServer(): Promise<FastifyInstance> {
    console.log("Building server... [1/3]")
    const app = fastify({ ignoreTrailingSlash: true })
        .setValidatorCompiler(TypeBoxValidatorCompiler)
        .withTypeProvider<TypeBoxTypeProvider>()

    app.get("/ping", async () => {
        return "pong\n"
    })

    console.log("Registering plugins... [2/3]")
    app.register(
        async (instance) => {
            instance.register(autoLoad, {
                dir: join(__dirname, "src/plugins"),
                dirNameRoutePrefix: false,
                forceESM: true,
            })
        },
        { prefix: apiPrefix }
    )

    await app.ready()
    console.log("Server ready. [3/3]")
    logger.info(app.printRoutes())

    return app
}

export default buildServer
