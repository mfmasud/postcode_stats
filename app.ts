import fastify, { type FastifyInstance } from "fastify";
import autoLoad from '@fastify/autoload'
import { v2apiPrefix } from './src/config/global.js'
import logger from './src/utils/logger.js'

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Plugins
//import initDBPlugin from "./src/plugins/util/initDB.js";

// Routes
// import specialRoutes from "./src/plugins/special/special.js";
// import rootRoutes from "./src/plugins/root.js";
// const postcodes = require("./routes/postcodes");
// const users = require("./routes/users");
// const search = require("./routes/search");

async function buildServer(): Promise<FastifyInstance> {
    const app = fastify({ ignoreTrailingSlash: true })

    //app.register(initDBPlugin);

    app.get("/ping", async () => {
        return "pong\n"
    })

    app.register(async (instance) => {
        instance.register(autoLoad, {
            dir: join(__dirname, 'src/plugins'),
            dirNameRoutePrefix: false,
            forceESM: true,
        })
    }, { prefix: v2apiPrefix })

    //app.register(rootRoutes);
    // app.register(specialRoutes);
    // app.use(postcodes.routes());
    // app.use(users.routes());
    // app.use(search.routes());

    await app.ready();
    logger.info(app.printRoutes())

    return app
} 

export default buildServer;