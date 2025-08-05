import fastify, { type FastifyReply, type FastifyRequest } from 'fastify'

const server = fastify()

server.get('/ping', async (request: FastifyRequest, reply: FastifyReply) => {
    return 'pong\n';
});

//require("dotenv").config();

//const logger = require("./utils/logger");

// logger.info(process.env)
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
 *
 * @async
 * @function startServer
 *
 * @param {Object} app - The Fastify server object.
 * @param {Number} port - The port to listen on for incoming requests.
 *
 * @returns {Promise} A Promise that resolves when the server is started/listening.
 * @throws {Error} Throws an error if the server fails to start.
 *
 */
async function startServer(server: fastify.FastifyInstance, port: number) {
  try {
    // reset dummy dbs in order
    //await database.connectDB(true);
    //await database.initUserDB();
    //await database.resetDataDB();
    //await database.initLocationDB();

    // start Fastify server
    server.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
        if (err) {
          console.error(err)
          process.exit(1)
        }
        //logger.info(`Server listening at ${address}`)
        console.log(`Server listening at ${address}`)
      })
  } catch (error: unknown) {
    if (error instanceof Error) {
      //logger.error(`Error starting server:\n${error.message}`);
      console.error(`Error starting server:\n${error.message}`);
    } else {
      //logger.error('Error starting server: Unknown error occurred');
      console.error('Error starting server: Unknown error occurred');
    }
  }
}
(async () => {
  await startServer(server, port);
})();
