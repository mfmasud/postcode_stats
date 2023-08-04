/**
 * @file Defines special routes for the API, such as the public homepage and a private route for testing purposes.
 * @module routes/special
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires koa-router
 * @requires controllers/auth
 * @requires utils/logger
 *
 * @exports router
 */

const Router = require("koa-router");

const auth = require("../controllers/auth");

const User = require("../models/User");
const {generateToken} = require("../strategies/jwt");

const logger = require("../utils/logger");

const router = Router({ prefix: "/api/v1" });
router.get("/", publicAPI);
router.get("/private", auth, UserDetails); // for testing purposes
router.get("/login", loginUserJWT);

/**
 * A function accessible by anyone to return a message from the API.
 *
 * @function publicAPI
 *
 * @param {Object} ctx - The context for the function call, representing the request made to it.
 * @returns {undefined} This function does not return anything back, nor does it call the next middleware. It just updates the response body with a message and a status code.
 */
function publicAPI(ctx) {
  logger.info(
    `Incoming ${ctx.request.method} request from ${ctx.req.socket.remoteAddress} to ${ctx.req.headers.host}${ctx.request.url}`
  ); // baseURl/api/v1
  ctx.status = 200;
  ctx.body = {
    message: "Hello and welcome to the UK Location API!",
  };
}

/**
 * A function which displays the details of the current user. If no user has been authenticated, a message is returned saying so.
 *
 * @function UserDetails
 *
 * @param {Object} ctx - The context for the function call, representing the request made to it.
 * @returns {undefined} ctx is modified with a 200 status code and a body representing all the user's details.
 */
function UserDetails(ctx) {
  logger.info(`UserDetails accessed from ${ctx.request.ip}`);
  const user = ctx.state.user;

  if (!user) {
    logger.info(`User not logged in`);
    ctx.throw(401, "No user details available. Please log in to see them.");
    return;
  }

  logger.info(`Details returned for User "${user.username}" in message body.`);
  ctx.status = 200;
  ctx.body = {
    user,
  };
}

/**
 * A special route to generate a JWT token for a given user and return it in the body
 * 
 * @async
 * @function loginUserJWT
 * 
 * @param {Object} ctx - The context for the function call, representing the request made to it.
 * @returns {undefined} ctx is modified with a 200 status code and a body representing the generated token.
 * 
 */
async function loginUserJWT(ctx) {
    logger.info(`loginUserJWT accessed from ${ctx.request.ip} for user id ${ctx.query.id}`);
    const user = await User.findOne({id: ctx.query.id});

    if (!user) {
        logger.info(`User not found`);
        ctx.throw(401, "User not found");
        return;
    }
    //logger.info(`User found ${JSON.stringify(user)}`);
    const token = generateToken(user);

    logger.info(`Token generated for User "${user.username}" in message body.`);
    ctx.status = 200;
    ctx.body = {
      "jwt": token
    }
}

module.exports = router;
