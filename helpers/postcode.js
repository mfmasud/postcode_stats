const axios = require("axios");
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
  //console.log(result);
  if (!result.result) {
    console.log("No postcodes found, returning nothing");
    return;
  }
  const queryResult = result.result[0];
  //console.log(queryResult); // postcodes.io postcode object
  return queryResult.postcode;
}

async function getRandomPostcode() {
  try {
    const response = await axios.get(
      "https://api.postcodes.io/random/postcodes"
    );

    // EXTREMELY unlikely but added nonetheless.
    const postcodeExists = await Postcode.findOne({
      postcode: response.data.result.postcode,
    });

    if (postcodeExists) {
      console.log(
        "Postcode already exists in db: " + response.data.result.postcode
      );
      return postcodeExists;
    }

    await processPostcode(response.data.result);
    return response.data.result;
  } catch (error) {
    console.error(error);
  }
}

async function getPostcode(validPostcodeString) {
  // check if postcode exists in db
  const postcodeExists = await Postcode.findOne({
    postcode: validPostcodeString,
  });

  if (postcodeExists) {
    console.log("Postcode already exists in db: " + validPostcodeString);
    return postcodeExists;
  }

  try {
    const response = await axios.get(
      `https://api.postcodes.io/postcodes/${validPostcodeString}`
    );
    await processPostcode(response.data.result);
    return response.data.result;
  } catch (error) {
    console.error(error);
  }
}

async function validatePostcode(postcodeString) {
  try {
    const response = await axios.get(
      `https://api.postcodes.io/postcodes/
      ${postcodeString}
      /validate`
    );

    console.log(`${postcodeString} is valid: ${response.data.result}`);

    if (response.data.result === true) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
  }
}

async function processPostcode(postcodeObject) {
  console.log("Processing:", postcodeObject.postcode);

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
    console.log("Successfully saved postcode: " + postcodeObject.postcode);
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  findPostcodeFromWGS84,
  getRandomPostcode,
  getPostcode,
  validatePostcode,
  processPostcode,
};
