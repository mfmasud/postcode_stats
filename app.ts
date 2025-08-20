import fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";

// Plugins
import dbPlugin from "./src/plugins/db.js";

// Routes
import specialRoutes from "./routes/special.js";
// const postcodes = require("./routes/postcodes");
// const users = require("./routes/users");
// const search = require("./routes/search");

function buildServer(): FastifyInstance {
    const app = fastify()

    app.register(dbPlugin);

    app.get("/ping", async (request: FastifyRequest, reply: FastifyReply) => {
        return "pong\n"
    })

    app.register(specialRoutes, { prefix: "/api/v2" });
    // app.use(postcodes.routes());
    // app.use(users.routes());
    // app.use(search.routes());

    return app
} 

export default buildServer;