/**
 * @file Contains the main search routes for the API, allowing users to search for a postcode/lat-long pair and get related stops and crimes.
 * @module routes/search
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 * 
 * @requires koa-router
 * @requires koa-bodyparser
 * @requires controllers/auth
 * @requires utils/logger
 * @requires ajv
 * @requires models/User
 * @requires models/Role
 * @requires models/Postcode
 * @requires models/Search
 * @requires schemas/latlong
 * @requires permissions/search
 * @requires helpers/postcode
 * @requires helpers/search
 * 
 * @exports router
 */

const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const auth = require("../controllers/auth");
const router = Router({ prefix: "/api/v1/search" });

const logger = require("../utils/logger");
const Ajv = require("ajv");
const ajv = new Ajv();

// models and json schemas
const User = require("../models/User");
const Role = require("../models/Role");
const Postcode = require("../models/Postcode");
const Search = require("../models/Search");
const latlongSchema = require("../schemas/latlong.json");
const validateLatLong = ajv.compile(latlongSchema);

// permissions
const createAbilityFor = require("../permissions/search");

// helpers
const {
  findPostcodeFromWGS84,
  getPostcode,
  getRandomPostcode,
  validatePostcode,
} = require("../helpers/postcode");
const {
  getRelatedStops,
  getRelatedCrimes,
  linkAtco,
} = require("../helpers/search");

// routes
router.post("/", auth, bodyParser(), searchArea); // POST - finds a postcode internally
router.get("/", auth, bodyParser(), searchPostcode); // GET - verifies and searches using postcode from the request body
router.get("/random", auth, searchRandom); // admins only - for testing

/**
 * A function which searches location data using a pair of latitude and longitude values in the query parameters.  
 * 
 * @async
 * @function searchArea
 * 
 * @param {Object} cnx - The Koa context object containing the request and response information.
 * @param {Function} next - The next middleware to be called.
 * @throws {Error} 400 if the latitude or longitude values are missing or invalid.
 * @throws {Error} 403 if the user does not have permission to search a location.
 * @returns {undefined} cnx is modified with a 200 status code and a body containing the search results.
 * 
 * @see {@link findPostcodeFromWGS84} for more information on the function used to find the postcode from the lat-long pair.
 * @see {@link searchPostcode} for more information on the primary function used to search postcodes, used internally in this function.
 * 
 * @todo Update the reverseLookup property to be false if the postcode is found via this function.
 * 
 */
async function searchArea(cnx, next) {
  // POST and latitude/longitude in query params
  // allows anyone to search via a lat and long in the body of the request
  // returns a list of property listings, transport nodes and crime.

  const { latitude, longitude } = cnx.query;

  const lat = latitude;
  const long = longitude;

  logger.info(`searching for lat: ${lat} long: ${long}`);

  // Check for empty values
  if (!lat || !long) {
    cnx.throw(400, "Please provide valid latitude and longitude values.");
    return;
  }

  try {
    var latFloat = parseFloat(lat);
    var longFloat = parseFloat(long);
  } catch (error) {
    logger.error(error);
    cnx.throw(400, "Please provide valid latitude and longitude values.");
    return;
  }

  const locationObj = { latitude: latFloat, longitude: longFloat };
  //logger.info(locationObj);
  //logger.info(validateLatLong(locationObj));

  // Validate the lat/long values
  if (!validateLatLong(locationObj)) {
    const errorMessages = [
      "Please provide valid latitude and longitude values:",
    ];
    for (const error of validateLatLong.errors) {
      // dataPath below could change in the future
      errorMessages.push(
        `Value for ${error.dataPath.slice(1)} ${error.message}`
      ); // "value for x should be <=y"
    }

    logger.error(`Lat/Long validation error: ${JSON.stringify(validateLatLong.errors[0])}`);
    cnx.status = 400;
    cnx.body = errorMessages.join("\n");
    return;
  }

  let { user } = cnx.state;
  if (!user) {
    user = User({ role: await Role.findOne({ name: "none" }) });
  }
  const ability = createAbilityFor(user);

  if (ability.can("create", "Search")) {
    // lookup lat long to postcode to generate data for postcode field, then search via postcode

    const findPostcode = await findPostcodeFromWGS84(locationObj);
    if (!findPostcode) {
      cnx.status = 200;
      cnx.body = "No postcode found for provided coordinates.";
    } else {
      cnx.request.body.postcode = findPostcode;
      await searchPostcode(cnx, next);
    }
  } else {
    logger.error("User does not have permission to perform this action.");
    cnx.throw(403, "You are not allowed to access this resource.");
  }
}

/**
 * A function which searches location data using a postcode from the request body.
 * 
 * @async
 * @function searchPostcode
 * 
 * @param {Object} cnx - The Koa context object containing the request and response information.
 * @param {Function} next - The next middleware to be called.
 * @throws {Error} 400 if the postcode is missing or invalid.
 * @throws {Error} 403 if the user does not have permission to search a location.
 * @returns {undefined} cnx is modified with a 200 status code and a body containing the search results.
 * 
 * @see {@link validatePostcode} for postcode validation.
 * @see {@link getPostcode} for postcode lookup using the postcodes.io API.
 * @see {@link module:model/Search} for the Search model used.
 * @see {@link module:permissions/search} for the permissions applied to this route.
 * 
 */
async function searchPostcode(cnx, next) {
  // GET and postcode in body.
  // allows anyone to search via a postcode in the request body.
  // returns a list of property listings, transport nodes and crime data

  let { postcode } = cnx.request.body;

  if (!postcode) {
    logger.info("No postcode provided.");
    cnx.throw(400, "Please provide a valid postcode.");
    return;
  }

  let { user } = cnx.state;
  if (!user) {
    user = User({ role: await Role.findOne({ name: "none" }) });
  }
  const ability = createAbilityFor(user);

  if (ability.can("create", "Search")) {
    const validPostcode = await validatePostcode(postcode);

    if (validPostcode) {
      const processedPostcode = await getPostcode(postcode);
      const dbPostcode = await Postcode.findOne({
        postcode: processedPostcode.postcode,
      });

      // check for existing search by comparing northing and easting values
      const existingSearch = await Search.findOne({
        Northing: dbPostcode.northings,
        Easting: dbPostcode.eastings,
      });

      if (!existingSearch) {
        logger.info("Saving new Search");
        // save the search to the database
        const newSearch = new Search({
          Postcode: dbPostcode,
          reverseLookup: true,
          latitude: dbPostcode.latitude,
          longitude: dbPostcode.longitude,
          Northing: dbPostcode.northings,
          Easting: dbPostcode.eastings,
        });
        await newSearch.save();
        await linkAtco(newSearch);
        await getRelatedStops(newSearch); // get all bus stops for location and link to search model
        await getRelatedCrimes(newSearch); // get all crimes for location and link to search model
      } else {
        logger.info(`Existing search found, ID: ${existingSearch.searchID}`);
      }

      const SearchModel = await Search.findOne({
        latitude: dbPostcode.latitude,
      }).populate(["Postcode", "queryBusStops", "queryCrimes"]);
      const body = SearchModel;
      // cnx.body = body + generateLinks(SearchModel);
      cnx.status = 200;
      cnx.body = body;
    } else {
      // invalid postcode
      logger.info("Invalid postcode provided.");
      cnx.throw(400, "Please provide a valid postcode.");
      return;
    }
  } else {
    logger.error("User does not have permission to perform this action.");
    cnx.throw(403, "You are not allowed to access this resource.");
    return;
  }
}

/**
 * A function which searches location data using a randomly generated postcode.  
 * Used for testing purposes, admins only.
 * 
 * @async
 * @function searchRandom
 * 
 * @param {Object} cnx - The Koa context object containing the request and response information.
 * @param {Function} next - The next middleware to be called.
 * @throws {Error} 403 if the user does not have permission to search a location.
 * @returns {undefined} cnx is modified with a 200 status code and a body containing the random postcode search results.
 * 
 * @see {@link getRandomPostcode} for random postcode generation.
 * @see {@link module:model/Search} for the Search model used.
 * @see {@link module:permissions/search} for the permissions applied to this route.
 * 
 */
async function searchRandom(cnx, next) {
  let { user } = cnx.state;
  if (!user) {
    // I could just return here, but this route might be possible for other roles in the future.
    user = User({ role: await Role.findOne({ name: "none" }) });
  }
  const ability = createAbilityFor(user);

  if (ability.can("create", "RandomSearch")) {
    const processedPostcode = await getRandomPostcode();
    const dbPostcode = await Postcode.findOne({
      postcode: processedPostcode.postcode,
    });

    // check for existing search by comparing northing and easting values - extremely unlikely as random postcodes are generated
    const existingSearch = await Search.findOne({
      Northing: dbPostcode.northings,
      Easting: dbPostcode.eastings,
    });

    if (!existingSearch) {
      logger.info("Saving new Random Search");
      // save the search to the database
      const newSearch = new Search({
        Postcode: dbPostcode,
        reverseLookup: true,
        latitude: dbPostcode.latitude,
        longitude: dbPostcode.longitude,
        Northing: dbPostcode.northings,
        Easting: dbPostcode.eastings,
      });

      await newSearch.save();
      await linkAtco(newSearch);
      await getRelatedStops(newSearch); // get all bus stops for location and link to search model
      await getRelatedCrimes(newSearch); // get all crimes for location and link to search model
    } else {
      logger.info(`Existing search found, ID: ${existingSearch.searchID}`);
    }

    const SearchModel = await Search.findOne({
      latitude: dbPostcode.latitude,
    }).populate(["Postcode", "queryBusStops", "queryCrimes"]);

    const body = SearchModel;
    cnx.status = 200;
    cnx.body = body;
  } else {
    logger.error("User does not have permission to perform this action.");
    cnx.throw(403, "You are not allowed to access this resource.");
  }
}
module.exports = router;
