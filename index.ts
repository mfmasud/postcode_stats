import fastify, { type FastifyReply, type FastifyRequest } from 'fastify'

const server = fastify()

server.get('/ping', async (request: FastifyRequest, reply: FastifyReply) => {
    return 'pong\n';
});

import dotenv from "dotenv";
dotenv.config();

import logger from "./utils/logger.js";
//logger.info(JSON.stringify(process.env, null, 2));
//const database = require("./helpers/database");

import specialRoutes from './routes/special.js';
// const postcodes = require("./routes/postcodes");
// const users = require("./routes/users");
// const search = require("./routes/search");

server.register(specialRoutes, { prefix: '/api/v2' });
// app.use(postcodes.routes());
// app.use(users.routes());
// app.use(search.routes());

const port = parseInt(process.env.PORT || '8080');

/**
 * Initializes the databases and starts the Fastify server.
 * @param server The Fastify server instance.
 * @param port The port to listen on for incoming requests.
 */
async function startServer(server: fastify.FastifyInstance, port: number) {
  try {
    // reset dummy dbs in order
    //await database.connectDB(true);
    //await database.initUserDB();
    //await database.resetDataDB();
    //await database.initLocationDB();

    // start Fastify server
    const address = await server.listen({ port, host: '0.0.0.0' });
    //logger.info(`Server listening at ${address}`)
    logger.info(`Server listening at ${address}`)
  } catch (err) {
    //logger.error(err);
    logger.error(err);
    process.exit(1);
  }
}

(async () => {
  await startServer(server, port);
})();
