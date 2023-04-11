const Search = require("../models/Search");
const BusStop = require("../models/BusStop");
const Atco = require("../models/Atco");

const logger = require("../utils/logger");

const { queryAtco } = require("../helpers/AtcoCodes");
const { getCrimeData } = require("../helpers/crime"); // can be switched to a model later

const mongoose = require("mongoose");

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

async function getRelatedCrimes(SearchModel) {
  const { latitude, longitude } = SearchModel;
  if (latitude && longitude) {
    await getCrimeData(latitude, longitude); // edit to return crime list _id after processing code.
    // SearchModel.queryCrimes = ... // first 5 related crimes
    // need to link search model to linkedCrimeList to crimeList
    if (SearchModel.linkedCrimeList){
      SearchModel.queryCrimes = SearchModel.linkedCrimeList.crimes.slice(0, 5);
    }
    
  } else {
    SearchModel.queryCrimes = []; // empty to indicate not found
  }

  await SearchModel.save();
  return;
}

async function getRelatedListings(SearchModel) {
  // unimplemented - Zoopla API is basically discontinued.
  const { latitude, longitude } = SearchModel;
  //await getPropertyData(latitude, longitude);
  return;
}

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

async function linkCrimeList(SearchModel) {
  // links crime list to search model
  // can be linked by latitude - assuming it is available. If not, this should have been calculated beforehand.
  return;
}

/**
 *
 * @param {mongoose.Object} PostcodeModel - The Postcode model object
 * @returns {mongoose.Object} The Atco model object to link to the Search
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
    await queryAtco(AtcoToLink.code);
    return AtcoToLink;
  } else {
    logger.info("Matching ATCO not found");
    return;
  }
}

module.exports = {
  getRelatedStops,
  getRelatedCrimes,
  linkAtco,
  linkCrimeList,
};
