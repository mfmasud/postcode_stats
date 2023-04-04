const Router = require("koa-router");

const auth = require("../controllers/auth");

const logger = require("../utils/logger");

const router = Router({ prefix: "/api/v1" });
router.get("/", publicAPI);
router.get("/private", auth, UserDetails); // for testing purposes

/**
 * A function accessible by anyone to return a message from the API.
 * @param {Object} ctx - The context for the function call, representing the request made to it.
 * @returns {undefined} This function does not return anything back, nor does it call the next middleware. It just updates the response body with a message and a status code.
 */
function publicAPI(ctx) {
  logger.info(`API homepage accessed from ${ctx.request.ip}`);
  ctx.status = 200;
  ctx.body = {
    message: "Hello and welcome to the UK Location API!",
  };
}


/**
 * A function which displays the details of the current user. If no user hsa been authenticated, a message is returned saying so.
 * @param {Object} ctx - The context for the function call, representing the request made to it.
 * @returns {undefined} ctx is modified with a 200 status code and a body representing all the user's details.
 */
function UserDetails(ctx) {
  logger.info(`UserDetails accessed from ${ctx.request.ip}`);
  const user = ctx.state.user;

  if (!user) {
    logger.info(`User not logged in`);
    ctx.status = 200;
    ctx.body = "No user details available. Please log in to see them."
    return;
  }

  logger.info(`Details returned for User "${user.username}" in message body.`);
  ctx.status = 200;
  ctx.body = {
    user,
  };
}

module.exports = router;
