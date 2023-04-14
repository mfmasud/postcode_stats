/**
 * @file Defines the route functions for the /postcodes route.
 * @module routes/postcodes
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires koa-router
 * @requires controllers/auth
 * @requires utils/logger
 * @requires models/User
 * @requires models/Role
 * @requires models/Postcode
 * @requires permissions/postcodes
 * @requires helpers/postcode
 *
 * @exports router
 */

const Router = require("koa-router");
const auth = require("../controllers/auth");
const router = Router({ prefix: "/api/v1/postcodes" });

const logger = require("../utils/logger");

const User = require("../models/User");
const Role = require("../models/Role");
const Postcode = require("../models/Postcode");

const createAbilityFor = require("../permissions/postcodes");

const {
  getPostcode,
  getRandomPostcode,
  validatePostcode,
} = require("../helpers/postcode");

router.get("/", auth, getAllPostcodes); // allows admins to view all the postcodes that have been saved
router.get("/random", auth, getRandomPostcodeRoute); // only authenticated users can access this route
router.get("/:postcode", auth, getPostcodeRoute); // Search for specific valid postcode.

/**
 * Allows admins (or anyone who can "readAll" "Postcode" objects) to view all the postcodes that have been saved in the `Postcodes` collection.
 *
 * @async
 * @function getAllPostcodes
 *
 * @param {Object} cnx - Koa context object
 * @throws {Error} 401 if the user is not logged in.
 * @throws {Error} 403 if the user is not authorised to view this resource.
 * @returns {undefined} Nothing, updates the context object with the postcodes from the database.
 *
 * @see {@link getAllPostcodes} - fetches all the postcodes from the database.
 *
 */
async function getAllPostcodes(cnx) {
  const { user } = cnx.state;
  if (!cnx.state.user) {
    logger.error("[401] User needs to log in.");
    cnx.throw(401, "You are not logged in.");
    return;
  }
  const ability = createAbilityFor(user);

  if (ability.can("readAll", "Postcode")) {
    const postcodes = await Postcode.find();
    cnx.status = 200;
    cnx.body = postcodes;
  } else {
    logger.error("[403] User is not authorised to view this resource.");
    cnx.throw(403, "You are not authorised to view this resource");
  }
}

/**
 * Returns a random postcode from the database. Only authenticated users can access this route.
 *
 * @async
 * @function getRandomPostcodeRoute
 *
 * @param {Object} cnx - Koa context object
 * @throws {Error} 401 if the user is not logged in.
 * @throws {Error} 403 if the user is not authorised to view this resource.
 * @returns {undefined} Nothing, updates the context's response body with the random postcode returned from getRandomPostcode.
 *
 * @see {@link getRandomPostcode} - fetches a random postcode using the postcode.io API.
 *
 */
async function getRandomPostcodeRoute(cnx) {
  const { user } = cnx.state;
  if (!cnx.state.user) {
    logger.error("[401] User needs to log in.");
    cnx.throw(401, "You are not logged in.");
    return;
  }
  const ability = createAbilityFor(user);

  if (ability.can("read", "Postcode")) {
    const randompostcode = await getRandomPostcode();
    cnx.status = 200;
    logger.info(`returned postcode ${randompostcode.postcode}`);
    cnx.body = randompostcode;
  } else {
    logger.error("[403] User is not authorised to view this resource.");
    cnx.throw(403, "You are not authorised to view this resource");
  }
}

/**
 * Returns a postcode from the database. Only authenticated users can access this route.
 *
 * @async
 * @function getPostcodeRoute
 *
 * @param {Object} cnx - Koa context object
 * @throws {Error} 400 if the postcode is not provided or is invalid.
 * @throws {Error} 403 if the user is not authorised to view this resource.
 * @returns {undefined} Nothing, updates the response body with the postcode returned from getPostcode.
 *
 * @see {@link getPostcode} - fetches a postcode using the postcode.io API, or a cached version from the database.
 * @see {@link validatePostcode} - validates the postcode using the postcode.io API.
 *
 */
async function getPostcodeRoute(cnx) {
  let { postcode } = cnx.params;

  if (!postcode) {
    logger.error("No postcode provided.");
    cnx.throw(400, "Please provide a postcode.");
    return;
  }

  let { user } = cnx.state;
  if (!user) {
    user = User({ role: await Role.findOne({ name: "none" }) });
  }
  const ability = createAbilityFor(user);

  if (ability.can("read", "Postcode")) {
    const validPostcode = await validatePostcode(postcode);

    if (validPostcode) {
      const body = await getPostcode(postcode);
      cnx.status = 200;
      logger.info(`returned postcode ${body.postcode}`);
      cnx.body = body;
    } else {
      logger.error("Invalid postcode provided.");
      cnx.throw(400, "Please provide a valid postcode.");
    }
  } else {
    logger.error("[403] User is not authorised to view this resource.");
    cnx.throw(403, "You are not authorised to view this resource");
  }
}

module.exports = router;
