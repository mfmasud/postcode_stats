const logger = require("../../utils/logger");

const auth = require("../../controllers/auth");
const User = require("../../models/User");
const {generateToken} = require("../../strategies/jwt");

const Router = require("@koa/router");
const router = new Router({ prefix: "/api/v1" });

router.get("/login", loginUserJWT);

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