/**
 * @file Contains functions to process ATCO codes and query the NAPTAN API for bus stops.
 * @module helpers/AtcoCodes
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires utils/logger
 * @requires axios
 * @requires jsdom
 * @requires csvtojson
 * @requires models/Atco
 * @requires models/BusStop
 * @requires types/atco
 *
 * @exports getAtcoCodes
 * @exports queryAtcoAPI
 * @exports processAtcoString
 * @exports saveAtcoList
 *
 * @see {@link https://www.twilio.com/blog/web-scraping-and-parsing-html-in-node-js-with-jsdom|web scraping and parsing HTML in javascript} for information on how to scrape HTML data.
 *
 */

/*
related note:
docs/notes/atco_codes.txt
*/

import logger from "../utils/logger.js";

import axios from "axios";
import { JSDOM } from "jsdom";
import csvtojson from "csvtojson";

import Atco from "../models/Atco.js";
import BusStop from "../models/BusStop.js";
import type { 
  ProcessedAtcoCodes, 
  RawAtcoString, 
  AtcoCode 
} from "../types/atco.js";

/**
 * Processes the list of ATCO codes for local authorities.
 * Separated from saveAtcoList to allow for testing without saving codes to the database.
 *
 * @async
 * @function getAtcoCodes
 *
 * @returns {String[]} An array of ATCO codes - codeList
 *
 * @see saveAtcoList
 */
async function getAtcoCodes() {
  const url = "https://beta-naptan.dft.gov.uk/download/la";
  const response = await axios.get(url);
  const dom = new JSDOM(response.data);

  const options = dom.window.document.querySelectorAll(
    "#localAuthorityName option"
  );

  const codeList: string[] = [];

  options.forEach((option) => {
    const text = option?.textContent?.trim();
    if (text) {
      codeList.push(text);
    } else {
      logger.error("No text content found for option", option);
    }
  });

  // remove the pick a local authority option
  codeList.shift();

  //logger.info(codeList);

  return codeList;
}

/**
 * Saves the processed ATCO codes to the Atco collection.
 *
 * @async
 * @function saveAtcoList
 *
 * @see getAtcoCodes
 * @see processAtcoString
 *
 */
async function saveAtcoList() {
  // run on db initialisation to get a list of searchable ATCOs.
  // Can integrate the functions in helpers/locations to add the alternative location names.
  const codeList = await getAtcoCodes();
  for (const code of codeList) {
    await processAtcoString(code);
  }
}

/**
 * Processes the ATCO codes into the format code:{location, region}. Run by saveAtcoList.
 *
 * @async
 * @function processAtcoString
 *
 * @param {RawAtcoString} data - The ATCO code to process
 * @returns nothing, saves the processed data to the Atco collection.
 *
 * @see saveAtcoList
 *
 * @example
 * const data = "Aberdeenshire / Scotland (630)"
 * // returns {630: {location: Aberdeenshire, region: Scotland}}
 */
async function processAtcoString(data: RawAtcoString) {
  const location = data.split(" / ")[0];
  const region = data.split(" / ")[1]?.split(" (")[0];
  const atco = data.split(" / ")[1]?.split(" (")[1]?.split(")")[0];

  if (!atco) {
    logger.error("Invalid ATCO code format", data);
    return;
  }

  const processedData: ProcessedAtcoCodes = {};
  processedData[atco] = { location: location || "", region: region || "" };
  //logger.info(`${atco}: ${processedData[atco]}`);

  const existingAtco = await Atco.exists({ code: atco }); // can filter for e.g. busstops.length === 0 to check for empty codes
  if (existingAtco) {
    //logger.info(`ATCO ${atco} already exists in db`);
    return; // skip creating another Atco for no reason.
  }

  await Atco.create({
    code: atco,
    region: region,
    location: location,
    busstops: [],
    AllProcessed: false,
  });
}

// API for transport nodes: https://naptan.api.dft.gov.uk/swagger/index.html
// example api call: https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv&atcoAreaCodes=420
// 420 is Warwickshire / West Midlands.

/**
 * Sends a request to the NAPTAN API to get the bus stops for a given ATCO code.
 * The API returns CSV data which is then processed by processCSV.
 *
 * @async
 * @function queryAtcoAPI
 *
 * @param {AtcoCode} code - The ATCO code to query the NAPTAN API
 * @returns {Promise<void>} Nothing, processes the data and saves to database
 *
 * @see processCSV
 */
async function queryAtcoAPI(code: AtcoCode): Promise<void> {
  // backend function to query the API for bus stops
  // run when linking ATCOs to searches (to find bus stops).
  // basic validation - not meant to be complete
  const format = "csv";

  const AtcoExists = await Atco.findOne({ code: code });
  if (AtcoExists?.AllProcessed) {
    logger.info(`All ATCO ${code} BusStops found, not processing any further.`);
    return;
  }

  const api = "https://naptan.api.dft.gov.uk/v1/access-nodes";
  const query = `dataFormat=${format}&atcoAreaCodes=${code}`;
  // Note: If no codes are specified, the download size will be 100Mb - The whole dataset.

  try {
    const response = await axios.get(`${api}?${query}`);
    // response is raw csv data, not an object should be cached and parsed into json

    if (format === "csv") {
      logger.info(`Processing ATCO code: ${code}`);
      await processCSV(code, response.data);
      logger.info(`Finished processing ATCO: ${code}`);
    } else {
      logger.info("Invalid data format. should be csv");
      return;
    }
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Processes the CSV data from the NAPTAN API into the BusStop collection and saves it to the relevant Atco collection.
 *
 * @async
 * @function processCSV
 *
 * @param {AtcoCode} code - The ATCO code to process the CSV data for
 * @param {string} rawdata - The raw CSV data to process, retrieved from queryAtcoAPI
 * @returns {Promise<void>} Nothing, saves the processed data to the BusStop collection and updates the relevant Atco collection.
 *
 * @see queryAtcoAPI
 *
 */
async function processCSV(code: AtcoCode, rawdata: string): Promise<void> {
  // this can take a while, should be run on startup of the server so users use processed mongodb models instead of processing them when a request is made
  const associatedAtco = await Atco.findOne({ code: code });
  if (!associatedAtco) {
    logger.info(
      "Stopping processing of bus stops. Either code is invalid or ATCO list has not been loaded."
    );
  }

  // parse csv using csvtojson
  const data = await csvtojson().fromString(rawdata);
  //logger.info(data);
  // data is an array of objects e.g. dictionary of column:value pairs

  // filter out data to just bus stops
  const busstops = data.filter(
    (row) =>
      row.StopType === "BCT" &&
      row.Status === "active" &&
      row.Northing &&
      row.Easting
  );
  // can also filter to city level at this stage, by finding the right column. "430" has 15,000 values to process ...
  // BNG can be converted to lat long if needed to simplify calculations. See https://github.com/chrisveness/geodesy/blob/master/osgridref.js

  // store each result into the BusStop collection and associate it with the ATCO
  const newBusStops = [];
  const ids = [];
  for (const row of busstops) {
    //logger.info(row);

    const existingBusStop = await BusStop.exists({
      ATCO_long: row.ATCOCode,
    });
    if (existingBusStop) {
      continue;
    }

    const newBusStop = new BusStop({
      ATCO_long: row.ATCOCode,
      ATCO_short: code,
      CommonName: row.CommonName,
      Street: row.Street,
      Longitude: row.Longitude,
      Latitude: row.Latitude,
      Northing: row.Northing,
      Easting: row.Easting,
    });

    ids.push(newBusStop._id);
    newBusStops.push(newBusStop);
  }

  if (newBusStops.length > 0) {
    await BusStop.insertMany(newBusStops);
    try {
      if (associatedAtco) {
        associatedAtco.busstops = ids;
        associatedAtco.AllProcessed = true;
        await associatedAtco.save();
      } else {
        logger.error("Associated ATCO code not found");
      }
    } catch (error) {
      logger.error(error);
    }
  }
}

export { getAtcoCodes, queryAtcoAPI, processAtcoString, saveAtcoList };
