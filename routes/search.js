const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const auth = require("../controllers/auth");
const router = Router({ prefix: "/api/v1/search" });

const mongoose = require("mongoose");
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
  linkCrimeList,
} = require("../helpers/search");

// routes
router.post("/", auth, bodyParser(), searchArea); // POST - finds a postcode internally
router.get("/", auth, bodyParser(), searchPostcode); // GET - verifies and searches using postcode from the request body
router.get("/random", auth, searchRandom); // admins only - for testing

// functions to handle the routes
async function searchArea(cnx, next) {
  // POST and latitude/longitude in query params
  // allows anyone to search via a lat and long in the body of the request
  // returns a list of property listings, transport nodes and crime.

  const { latitude, longitude } = cnx.query;

  const lat = latitude;
  const long = longitude;

  logger.info(`lat: ${lat} long: ${long}`);

  // Check for empty values
  if (!lat || !long) {
    cnx.status = 400;
    cnx.body = "Please provide latitude and longitude values.";
    return;
  }

  try {
    var latFloat = parseFloat(lat);
    var longFloat = parseFloat(long);
  } catch (error) {
    logger.error(error);
    cnx.status = 400;
    cnx.body = "Please provide valid latitude and longitude values.";
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

    logger.error(`Lat/Long validation error: ${validateLatLong.errors}`);
    cnx.status = 400;
    cnx.body = errorMessages.join("\n");
    return;
  }

  let { user } = cnx.state;
  if (!user) {
    user = User({ role: Role({ name: "none" }) });
  }
  const ability = createAbilityFor(user);

  if (ability.can("read", "Search")) {
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
    cnx.status = 403;
    cnx.body = "You are not authorised to view this resource";
  }
}

async function searchPostcode(cnx, next) {
  // GET and postcode in body.
  // allows anyone to search via a postcode in the request body.
  // returns a list of property listings, transport nodes and crime data

  let { postcode } = cnx.request.body;

  if (!postcode) {
    cnx.status = 400;
    cnx.body = "Please provide a postcode.";
    return;
  }

  let { user } = cnx.state;
  if (!user) {
    user = User({ role: Role({ name: "none" }) });
  }
  const ability = createAbilityFor(user);

  if (ability.can("read", "Search")) {
    const validPostcode = await validatePostcode(postcode);

    if (validPostcode) {
      const processedPostcode = await getPostcode(postcode);
      const dbPostcode = await Postcode.findOne({
        postcode: processedPostcode.postcode,
      });

      // check for existing search by comparing northing
      // TODO: move to function
      const existingSearch = await Search.findOne({
        Northing: dbPostcode.northings,
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
        // await linkCrimeList(newSearch);
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
      // invalid postcode
      cnx.status = 400;
      cnx.body = "Please provide a valid postcode.";
      return;
    }
  } else {
    cnx.status = 403;
    cnx.body = "You are not authorised to view this resource";
    next();
  }
}

async function searchRandom(cnx, next) {
  let { user } = cnx.state;
  if (!user) {
    user = User({ role: Role({ name: "none" }) });
  }
  const ability = createAbilityFor(user);

  if (ability.can("read", "RandomSearch")) {
    const processedPostcode = await getRandomPostcode();
    const dbPostcode = await Postcode.findOne({
      postcode: processedPostcode.postcode,
    });

    // check for existing search by comparing latitude - Extremely unlikely as random postcodes are generated
    const existingSearch = await Search.findOne({
      latitude: dbPostcode.latitude,
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
    }).populate(["Postcode", "queryBusStops"]);

    const body = SearchModel;
    cnx.status = 200;
    cnx.body = body;
  } else {
    cnx.status = 403;
    cnx.body = "You are not authorised to view this resource";
  }
}
module.exports = router;
