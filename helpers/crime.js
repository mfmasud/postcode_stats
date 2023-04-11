// https://data.police.uk/docs/method/crime-street/ - Uk crime data by street
// can search by lat and long and relate it to a search object.

const logger = require("../utils/logger");
const axios = require("axios");

const CrimeList = require("../models/CrimeList");
const Crime = require("../models/Crime");

/**
 * Queries the Police Data API for crime data using a pair of latitude and longitude values.
 * The data is then processed into a CrimeList using processCrimeData.
 * 
 * @async
 * @function getCrimeData
 * 
 * @param {Number} lat - The latitude to pass to the Police Data API
 * @param {Number} long - The longitude to pass to the Police Data API
 * @returns {*} - Returns nothing
 * 
 * @see processCrimeData
 * 
 */
async function getCrimeData(lat, long) {

  const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${long}`;
  const response = await axios.get(url);

  // Note: crimes appear lower for Scotland. Should be noted to end users.

  // returns the crimes in the most recent month
  const existingCrimeList = await CrimeList.exists({ latitude: lat });
  if (existingCrimeList) {
    logger.info(
      `Existing crime list found, ID: ${existingCrimeList.crimeListID}`
    );
    return;
  } else {
    await processCrimeData(lat, long, response.data);
  }

  return;
}


/**
 * Processes the crime data retrieved from the Police Data API into a CrimeList and Crime models.
 * This is currently capped at just the first 5 crimes per location to speed up the code.
 * 
 * @async
 * @function processCrimeData
 * 
 * @param {Number} lat - The latitude to pass to the Police Data API
 * @param {Number} long - The longitude to pass to the Police Data API
 * @param {*} rawCrimeData - The raw crime data to be processed, retrieved from getCrimeData
 * @returns {*} - Returns nothing
 * 
 * @see getCrimeData
 * 
 */
async function processCrimeData(lat, long, rawCrimeData) {
  logger.info("Processing new crime list");
  // model the Crime and categorise it too for paid / admins.
  // lat long to differentiate crime lists

  // logger.info(rawCrimeData); // can be empty
  // below code can be edited to handle a minimum amount of crimes required e.g. 5
  if (rawCrimeData.length === 0) {
    logger.info("No crime data.");
    CrimeList.create({
      crimeListID: 1,
      latitude: lat,
      longitude: long,
      count: 0,
      date: "X",
      emptydata: true,
    });
    // emptydata and the X here is used to indicate that there is no data.
    return;
  }

  const newCrimeList = new CrimeList({
    crimeListID: 1,
    latitude: lat,
    longitude: long,
    count: rawCrimeData.length,
    date: rawCrimeData[0].month,
  });

  // Only store 5 (or less) crimes to speed up operations. 5 is used by the search model.
  // City Of London for example has 2309 crimes in the area.
  rawCrimeData = rawCrimeData.slice(0, 5);

  const newCrimes = [];
  const ids = [];
  for (const data of rawCrimeData) {
    const existingCrime = await Crime.exists({ crimeID: data.id });
    if (existingCrime) {
      continue;
    }

    const newCrime = Crime({
      crimeID: data.id,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      crime_category: data.category,
      crime_date: data.month,
    });

    if (data.outcome_status) {
      newCrime.outcome_category = data.outcome_status.category;
      newCrime.outcome_date = data.outcome_status.month;
    }

    ids.push(newCrime._id);
    newCrimes.push(newCrime);

    //logger.info(newCrime);

  }

  //logger.info(newCrimes);

  if (newCrimes.length > 0) {
    await Crime.insertMany(newCrimes);

    try {
      newCrimeList.crimes = ids;
      await newCrimeList.save();

      //logger.info(newCrimeList);

    } catch (error) {
      logger.error(error);
    }
  }

  logger.info("Finished processing new crime list");

}

module.exports = {
  getCrimeData,
};
