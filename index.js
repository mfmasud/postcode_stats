require("dotenv").config();

const logger = require("./utils/logger")

// logger.info(process.env)

const Koa = require("koa");
const app = new Koa();

const database = require("./helpers/database");


const special = require("./routes/special");
const postcodes = require("./routes/postcodes");
const users = require("./routes/users");
const search = require("./routes/search");

app.use(special.routes());
app.use(postcodes.routes());
app.use(users.routes());
app.use(search.routes());

let port = process.env.PORT;

/**
 * Initializes the databases and starts the Koa server.
 *
 * @async
 * @function startServer
 *
 * @param {Object} app - The Koa application object.
 * @param {Number} port - The port to listen on for incoming requests.
 *
 * @returns {Promise} A Promise that resolves when the server is started/listening.
 * @throws {Error} Throws an error if the server fails to start.
 *
 */
async function startServer(app, port) {
  try {
    // reset dummy dbs - not awaited yet
    await database.connectDB(true);
    await database.initUserDB();
    await database.resetDataDB();
    await database.initLocationDB();

    // start koa server
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error(`Error starting server:\n${error.message}`);
  }
}
(async () => {
  await startServer(app, port);
})();
