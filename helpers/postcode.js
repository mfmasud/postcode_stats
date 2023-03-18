const axios = require("axios");
const Postcode = require("../models/Postcode");

async function getRandomPostcode() {
  try {
    const response = await axios.get(
      "https://api.postcodes.io/random/postcodes"
    );
    return response.data.result;
  } catch (error) {
    console.error(error);
  }
}

async function validatePostcode(postcode) {
  try {
    const response = await axios.get(
      `api.postcodes.io/postcodes/
      ${postcode}
      /validate`
    );

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
  //validate postcode using api call or anyoehre function

  console.log(postcodeObject.postcode);

  // fields to save: postcode, eastings, northings, country, longitude, latitude, region (can be null)
  // parliamentary_constituency, admin_district, admin_ward, parish, admin_county (can be null too)

  const {
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
    console.log(savedPostcode);
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  getRandomPostcode,
  validatePostcode,
  processPostcode,
};
