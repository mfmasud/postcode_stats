import fastify, { type FastifyInstance } from "fastify";
import autoLoad from '@fastify/autoload'
import { apiPrefix } from './src/config/global.js'

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Plugins
//import initDBPlugin from "./src/plugins/util/initDB.js";

// Routes
// import specialRoutes from "./src/plugins/special/special.js";
// const postcodes = require("./routes/postcodes");
// const users = require("./routes/users");
// const search = require("./routes/search");

function buildServer(): FastifyInstance {
    const app = fastify()

    app.decorate("conf", {
        v2apiPrefix: apiPrefix
    })
    
    //app.register(initDBPlugin);

    app.get("/ping", async () => {
        return "pong\n"
    })

    app.register(autoLoad, {
        dir: join(__dirname, 'src/plugins'),
        options: {prefix: apiPrefix}
    })

    //app.register(specialRoutes, { prefix: "/api/v2" });
    // app.use(postcodes.routes());
    // app.use(users.routes());
    // app.use(search.routes());

    return app
} 

export default buildServer;