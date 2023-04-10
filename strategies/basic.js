const BasicStrategy = require("passport-http").BasicStrategy;
const bcrypt = require("bcrypt");

const logger = require("../utils/logger")

const User = require("../models/User");

/**
 * Verifies passwords using bcrypt.
 *
 * @async
 * @function verifyPassword
 *
 * @param {Object} userobj - The User object with user information populated.
 * @param {string} password - The password to compare against.
 *
 * @returns {boolean} A boolean value indicating whether or not the password matches.
 *
 */
async function verifyPassword(userobj, password) {
  //logger.info("verifyPassword called");
  //logger.info(`userobj.password: ${userobj.password}`);
  //logger.info(userobj.password === password);

  const match = await bcrypt.compare(password, userobj.password);
  //logger.info(`password matched? ${match}`);
  //logger.info(`PW:${password}\nHASH:${userobj.password}\n`);
  return match;
}

/**
 * Authenticates a user via from given username and password.
 *
 * @async
 * @function checkUserAndPass
 *
 * @param {string} username - The username to authenticate.
 * @param {string} password - The password to authenticate.
 * @param {Function} done - A callback function that is called with either an error or the authenticated user.
 *
 * @returns {Promise<void>} A Promise that resolves after calling the done() middleware, returning the corresponding User object if successful.
 *
 */
const checkUserAndPass = async (username, password, done) => {
  logger.info(`Authenticating user with username "${username}"`);
  //logger.info(`password: ${password}`)

  // look up the user and check the password if the user exists
  // call done() with either an error or the user, depending on outcome

  if (!username || !password) {
    logger.info("No username or password provided");
    return done(null, false);
  } else {
    if (!username) {
      logger.info("No username provided"); // not sure how to trigger this one
      return done(null, false);
    }
    if (!password) {
      logger.info("No password provided");
      return done(null, false);
    }
  }

  try {
    const user = await User.findByUsername(username);

    if (!user) {
      // no user found in database
      logger.info(`No user found with username ${username}`);
      return( done(null, false))
    } else {
      // user found in database
      logger.info(`Found user ${username}`);
      if (await verifyPassword(user, password)) {
        // password correct
        logger.info(`Successfully authenticated user ${username}`);
        return done(null, user);
      } else {
        logger.info(`Password incorrect for user ${username}`);
      }
    }
  } catch (error) {
    logger.error(`Error during authentication for user ${username}`);
    return done(error);
  }
  return done(null, false); // username or password were incorrect
};

const strategy = new BasicStrategy(checkUserAndPass);
module.exports = strategy;
