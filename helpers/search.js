/**
 * @file Contains the functions to link data related to a search to the Search model.
 * @module helpers/search
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 * 
 * @requires models/Atco
 * @requires models/CrimeList
 * @requires utils/logger
 * @requires helpers/AtcoCodes
 * @requires helpers/crime
 * 
 * @exports getRelatedStops
 * @exports getRelatedCrimes
 * @exports linkAtco
 * 
 * @see {@link module:routes/search} for the route which uses these functions.
 * 
 */

const Atco = require("../models/Atco");
const CrimeList = require("../models/CrimeList");

const logger = require("../utils/logger");

const { queryAtcoAPI } = require("../helpers/AtcoCodes");
const { getCrimeData } = require("../helpers/crime");


/**
* Links a `CrimeList` to the `Search` model by comparing the latitude value used by both.  
* populates the Search model's linkedCrimeList field with the returned `CrimeList` model.  
*
* @async
* @function linkCrimeList
*
* @param {mongoose.Object} SearchModel - The `Search` model to link the `CrimeList` details to.
* @returns nothing - this function only links the `CrimeList` to the `Search` model.
*
* @throws {Error} If no matching `CrimeList` is returned from the database.
*
* @see {@link linkAtco} - links associated busstops to the `Search` model
* @see {@link getRelatedCrimes} - Adds the `Crime`s to the `Search` model.
*/
async function linkCrimeList(SearchModel) {
  // links crime list to search model
  // can be linked by latitude - assuming it is available. If not, this should have been calculated beforehand.

  const linkedCrimes = await CrimeList.findOne({latitude: SearchModel.latitude});
  if (linkedCrimes) {
    SearchModel.linkedCrimeList = linkedCrimes;
    logger.info("Successfully linked crime list to search");
  } else {
    logger.error("Could not link crime list to search.");
    return;
  }

  await SearchModel.save();
}

/**
 * Adds related crime data to the `Search` model. Requires the `Search` model to have a linked `CrimeList` already.  
 * Populates the `Search` model's `queryCrimes` field with the `Crime`s from the `CrimeList.crimes` array.  
 * 
 * @async
 * @function getRelatedCrimes
 * 
 * @param {mongoose.Object} SearchModel - The `Search` model to add the `CrimeList` details to.
 * @returns nothing, adds the `CrimeList` to the `Search` model.
 * 
 * @see {@link getCrimeData} - fetches the crime data from the Police API, stores it as a `CrimeList` model.
 * @see {@link linkCrimeList} - links the `CrimeList` to the `Search` model for use in this function.
 */
async function getRelatedCrimes(SearchModel) {
  const { latitude, longitude } = SearchModel;

  if (SearchModel.Postcode.country === "Northern Ireland") {
    // NI not handled by policing API.
    logger.info("Cannot link NI CrimeList.");
    return;
  }

  if (latitude && longitude) {
    await getCrimeData(latitude, longitude); // fetches the Police API
    await linkCrimeList(SearchModel); // Links the CrimeList data to the Search model
    if (SearchModel.linkedCrimeList){
      logger.info("Added crimes to search");
      SearchModel.queryCrimes = SearchModel.linkedCrimeList.crimes;
    } else {
      SearchModel.queryCrimes = []; // empty to indicate not found
    }
  } else {
    logger.error("Need LAT/LONG Coordinates to use the Police API.")
    SearchModel.queryCrimes = []; // empty to indicate not found
  }

  await SearchModel.save();
  return;
}

/**
 * Adds property data to the `Search` model.  
 * Currently unimplemented, as the Zoopla API is discontinued.  
 * The Urban Big Data Centre has a similar API which needs to be implemented.  
 * 
 * @async
 * @function getRelatedListings
 * 
 * @param {mongoose.Object} SearchModel - The `Search` model to add the property data to.
 * @returns nothing, adds the property data to the `Search` model's `queryListings` field.
 * 
 */
async function getRelatedListings(SearchModel) {
  const { latitude, longitude } = SearchModel;
  //await getPropertyData(latitude, longitude);
  return;
}


/**
 * Finds the related Atco model to link to a search.  
 * Takes the Postcode model and finds the related Atco model by searching the county, district, region and country values.  
 * This is necessary as region names are not consistent between the Postcode API and the Naptan API.  
 * Take for example the region "City Of London". The Postcode API returns this as the admin_district, but in the Naptan API returns this under "Greater London".  
 * 
 * @async
 * @function searchAtco
 * 
 * @param {mongoose.Object} PostcodeModel - The Postcode model object
 * @returns {mongoose.Object} The Atco model object to link to the Search
 * 
 * @todo Refactor this function to be more readable - A switch/case combined with a function to search for the Atco model would be better.
 * 
 * @see {@link linkAtco} - links associated busstops to the `Search` model
 * @see {@link getEnglandLocations} - Generates the `Atco` model's `other_names` field for England.
 * @see {@link getScotlandLocations} - Generates the `Atco` model's `other_names` field for Scotland.
 * @see {@link getWalesLocations} - Generates the `Atco` model's `other_names` field for Wales.
 */
async function searchAtco(PostcodeModel) {
  var {
    admin_county,
    admin_district,
    parliamentary_constituency,
    region,
    country,
  } = PostcodeModel;
  //logger.info(admin_county, admin_district, region);

  if (country === "Scotland") {
    region = "Scotland";
  }

  const pc = parliamentary_constituency;

  // starting to look ugly - maybe use functions or switch/case
  if (!admin_county) {
    logger.info("No admin county");

    if (!admin_district) {
      // no admin district
      logger.info("No admin district");
    } else {
      // admin district exists
      var AtcoToLink = await Atco.findOne({ location: admin_district });
      if (!AtcoToLink) {
        AtcoToLink = await Atco.findOne({ other_names: admin_district });
      }

      if (region === "London") {
        /*
        example: Lambeth - Local Authority / London Borough

        Postcode API data:
        Region: London
        admin_district: Lambeth

        In the ATCO List, this is part of "Greater London".
        In the future, this will be considered an altname for "London", generated from getEnglandLocations

        This also includes postcodes in the City of London (e.g. E1 7DA)
        */
        var AtcoToLink = await Atco.findOne({ location: "Greater London" });
      }

      if (!AtcoToLink && pc) {
        // parlimentiary constituency, e.g. Poole (South West)
        // Others like Bournemout East would be under Dorset (ceremonial country)
        var AtcoToLink = await Atco.findOne({ location: pc });
        if (!AtcoToLink) {
          AtcoToLink = await Atco.findOne({ other_names: pc });
        }
      }
    }
  } else {
    // admin county exists
    var AtcoToLink = await Atco.findOne({ location: admin_county });
    if (!AtcoToLink) {
      AtcoToLink = await Atco.findOne({ other_names: admin_county });
    }
  }

  if (AtcoToLink) {
    // match found
    logger.info(`Matching ATCO:" ${AtcoToLink.code}`);
    await queryAtcoAPI(AtcoToLink.code);
    return AtcoToLink;
  } else {
    logger.info("Matching ATCO not found");
    return;
  }
}

/**
 * Links the `Atco` model to the `Search` model.  
 * Currently called in the search route itself, instead of getRelatedStops, unlike linkCrimeList.  
 * 
 * @async
 * @function linkAtco
 * 
 * @param {mongoose.Object} SearchModel - The `Search` model to link the `Atco` model to.
 * @returns nothing, adds the `Atco` model to the `Search` model's `linkedATCO` field.
 * 
 * @see {@link linkCrimeList} - links associated crimes to the `Search` model using the `CrimeList` model.
 * @see {@link searchAtco} - Finds the correct `Atco` model to be linked.
 * 
 */
async function linkAtco(SearchModel) {
  // links Search model to correct ATCO from available information.
  // Should be run when search is created / postcode is updated.
  // Does not return anything
  logger.info("Looking to link Atco");

  var linkedAtco;

  if (SearchModel.Postcode.country === "Northern Ireland") {
    // Skip ATCO linking for northern irish postcodes e.g. BT23 6SA
    // linkedAtco = linkOther(SearchModel.Postcode)
    logger.info("Cannot link NI Atco.");
    return;
  } else {
    linkedAtco = await searchAtco(SearchModel.Postcode);
  }

  if (!linkedAtco) {
    return;
  }

  SearchModel.linkedATCO = linkedAtco;
  await SearchModel.save();
}


/**
 * Finds the related bus stops to a `Search` model.  
 * This is done by first finding and linking the associated `Atco` model using `linkAtco`.  
 * After this, the distance is calculated from `Atco.busstops` - the closest 5 `BusStop`s to the `Search` model's `latitute` and `longitude` fields.  
 * For now, only the first 5 `BusStop`s are returned as nothing is being calculated.  
 * 
 * @async
 * @function getRelatedStops
 * 
 * @param {mongoose.Object} SearchModel - The `Search` model to find the related bus stops for.
 * @param {number} radius - The radius in metres to search for bus stops in. Defaults to 1000m.
 * @returns nothing, adds the `BusStop` models to the `Search` model's `relatedStops` field.
 * 
 * @see {@link linkAtco} - Links the `Atco` model to the `Search` model.
 */
async function getRelatedStops(SearchModel, radius = 1000) {
  // bus stops around a 1km radius from a given point. maximum returned should be 4 points (arbitrary numbers)
  const { longitude, latitude, Northing, Easting } = SearchModel;

  let linkedAtco = await SearchModel.populate("linkedATCO");
  linkedAtco = linkedAtco.linkedATCO;

  // for java : https://stackoverflow.com/questions/22063842/check-if-a-latitude-and-longitude-is-within-a-circle
  // first check if there are latitude/ longitude for the query bus stop then search within the radius from SearchModel.latitude / longitude
  // just returning first 5 for now...
  // Need to convert BNG to lat/long for empty values or search using BNG instead. See https://github.com/chrisveness/geodesy/blob/master/osgridref.js to convert

  if (linkedAtco) {
    SearchModel.queryBusStops = linkedAtco.busstops.slice(0, 5);
  }

  await SearchModel.save();
}

module.exports = {
  getRelatedStops,
  getRelatedCrimes,
  linkAtco,
};
