const axios = require("axios");
const Postcode = require("../models/Postcode");

async function getRandomPostcode() {
    try {
        const response = await axios.get(
            "https://api.postcodes.io/random/postcodes"
        );
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

    if (postcodeObject.country === "Scotland") {
        region = "Scotland";
    }

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
    getRandomPostcode,
    getPostcode,
    validatePostcode,
    processPostcode,
};
