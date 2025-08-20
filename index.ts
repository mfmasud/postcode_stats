import buildServer from "./app.js";

import dotenv from "dotenv";
dotenv.config();

import logger from "./utils/logger.js";
//logger.info(JSON.stringify(process.env, null, 2));

import { connectDB, initUserDB, resetDataDB, initLocationDB } from "./helpers/database.js";

const server = buildServer();

const port = parseInt(process.env.PORT || "8080");

/**
 * Initialises the databases and starts the Fastify server.
 * @param port The port to listen on for incoming requests.
 */
async function startServer( port: number) {
  try {
    // reset dummy dbs in order
    await connectDB(true);
    await initUserDB();
    await resetDataDB();
    await initLocationDB();

    // start Fastify server
    const address = await server.listen({ port, host: "0.0.0.0" });
    logger.info(`Server listening at ${address}`);

    // graceful shutdown - https://thatarif.in/posts/token-based-authentication-with-fastify-jwt
    const listeners = ['SIGINT', 'SIGTERM'];
    listeners.forEach((signal) => {
      process.on(signal, async () => {
        await server.close();
        process.exit(0);
      });
    });
  } catch (err) {
    //logger.error(err);
    logger.error(err);
    process.exit(1);
  }
}

export default startServer(port);