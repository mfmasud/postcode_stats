import fastify, { type FastifyInstance } from "fastify";

// Plugins
import initDBPlugin from "./src/plugins/initDB.js";

// Routes
import specialRoutes from "./src/routes/special.js";
// const postcodes = require("./routes/postcodes");
// const users = require("./routes/users");
// const search = require("./routes/search");

function buildServer(): FastifyInstance {
    const app = fastify()

    app.register(initDBPlugin);

    app.get("/ping", async () => {
        return "pong\n"
    })

    app.register(specialRoutes, { prefix: "/api/v2" });
    // app.use(postcodes.routes());
    // app.use(users.routes());
    // app.use(search.routes());

    return app
} 

export default buildServer;