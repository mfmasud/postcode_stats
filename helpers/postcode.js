const axios = require("axios");

const logger = require("../utils/logger");

const Postcode = require("../models/Postcode");

/**
 * Represents a pair of latitude and longitude floats (WGS84)
 * @typedef {Object} LocationPair
 * @property {number} latitude - The latitude of the location.
 * @property {number} longitude - The longitude of the location.
 */

/**
 * Finds a postcode given a pair of latitude and longitude values.
 *
 * @async
 * @function findPostcodeFromWGS84
 *
 * @param {LocationPair} location - A pair of lat/long values to find a postcode for.
 *
 * @returns {(String|undefined)} A UK postcode or undefined if one has not been found.
 *
 */
async function findPostcodeFromWGS84(location) {
  const postcodeapi = "https://api.postcodes.io/postcodes"; // using bulk search as it works better for some reason, also more extensible
  const req = {
    geolocations: [
      {
        longitude: location.longitude,
        latitude: location.latitude,
        radius: 1000,
        limit: 1,
      },
    ],
  };
  const response = await axios.post(postcodeapi, req);
  const result = response.data.result[0];
  //logger.info(result);
  if (!result.result) {
    logger.info("No postcodes found, returning nothing");
    return;
  }
  const queryResult = result.result[0];
  //logger.info(queryResult); // postcodes.io postcode object
  return queryResult.postcode;
}

/**
 * Gets a random UK postcode from the postcodes.io API.  
 * Postcodes are guaranteed to be valid as they are retreived from the API directly.
 * 
 * @async
 * @function getRandomPostcode
 * 
 * @returns {*} An object containing the details of the postcode.
 * 
 * @see https://postcodes.io/docs for documentation of the returned object.
 * @see getPostcode
 * @see getRandomPostcodeRoute
 */
async function getRandomPostcode() {
  try {
    const response = await axios.get(
      "https://api.postcodes.io/random/postcodes"
    );

    // EXTREMELY unlikely but added nonetheless.
    const postcodeExists = await Postcode.exists({
      postcode: response.data.result.postcode,
    });

    if (postcodeExists) {
      logger.info(
        `Postcode already exists in db: ${response.data.result.postcode}`
      );
      return postcodeExists;
    }

    await processPostcode(response.data.result);
    return response.data.result;
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Gets a UK postcode from the postcodes.io API.  
 * If the postcode is already in the database, it will return the existing Postcode document instead.
 * 
 * @async
 * @function getPostcode
 * 
 * @param {String} validPostcodeString - A valid UK postcode.
 * @returns {*} An object containing the details of the postcode.
 * 
 * @see https://postcodes.io/docs for documentation of the returned object.
 * @see getRandomPostcode
 * @see validatePostcode
 */ 
async function getPostcode(validPostcodeString) {
  // check if postcode exists in db
  const postcodeExists = await Postcode.exists({
    postcode: validPostcodeString,
  });

  if (postcodeExists) {
    logger.info(`Postcode already exists in db: ${validPostcodeString}`);
    return postcodeExists;
  }

  try {
    const response = await axios.get(
      `https://api.postcodes.io/postcodes/${validPostcodeString}`
    );
    await processPostcode(response.data.result);
    return response.data.result;
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Validates a UK postcode using the postcodes.io validation API.
 * 
 * @async
 * @function validatePostcode
 * 
 * @param {String} postcodeString 
 * @returns A boolean value indicating whether the postcode is valid or not.
 * 
 * @see getPostcode
 */
async function validatePostcode(postcodeString) {
  try {
    const response = await axios.get(
      `https://api.postcodes.io/postcodes/
      ${postcodeString}
      /validate`
    );

    logger.info(`${postcodeString} is valid: ${response.data.result}`);

    if (response.data.result === true) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logger.error(error);
  }
}


/**
 * Processes a postcode object from the postcodes.io API and saves it to the database as a Postcode model.
 * 
 * @async
 * @function processPostcode
 * 
 * @param {Object} postcodeObject - A mongoose object containing the details of a postcode.
 * @returns {undefined} Nothing, the postcode is just saved to the database.
 * 
 * @see getPostcode
 */
async function processPostcode(postcodeObject) {
  logger.info(`Processing: ${postcodeObject.postcode}`);

  // fields to save: postcode, eastings, northings, country, longitude, latitude, region (can be null)
  // parliamentary_constituency, admin_district, admin_ward, parish, admin_county (can be null too)

  var {
    postcode,
    eastings,
    northings,
    country,
    longitude,
    latitude,
    region,
    parliamentary_constituency,
    admin_district,
    admin_ward,
    parish,
    admin_county,
  } = postcodeObject;

  const newPostcode = new Postcode({
    postcode: postcode,
    eastings: eastings,
    northings: northings,
    country: country,
    longitude: longitude,
    latitude: latitude,
    region: region,
    parliamentary_constituency: parliamentary_constituency,
    admin_district: admin_district,
    admin_ward: admin_ward,
    parish: parish,
    admin_county: admin_county,
  });

  try {
    await newPostcode.save();
    logger.info(`Successfully saved postcode: ${postcodeObject.postcode}`);
  } catch (error) {
    logger.error(error);
  }
}

module.exports = {
  findPostcodeFromWGS84,
  getRandomPostcode,
  getPostcode,
  validatePostcode,
  processPostcode,
};
