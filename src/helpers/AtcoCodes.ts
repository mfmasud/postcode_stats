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

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import type { 
  ProcessedAtcoCode, 
  RawAtcoString, 
  AtcoCode,
  AtcoCodeInfo
} from "../types/atco.js";

/**
 * Processes the list of ATCO codes for local authorities.
 * Separated from saveAtcoList to allow for testing without saving codes to the database.
 *
 * @async
 * @function getAtcoCodes
 *
 * @returns {RawAtcoString[]} An array of ATCO codes - codeList
 *
 * @see saveAtcoList
 */
async function getAtcoCodes(): Promise<RawAtcoString[]> {
  const url = "https://beta-naptan.dft.gov.uk/download/la";
  const response = await axios.get(url);
  const dom = new JSDOM(response.data);

  const options = dom.window.document.querySelectorAll(
    "#localAuthorityName option"
  );

  const codeList: RawAtcoString[] = [];

  options.forEach((option) => {
    const text = option?.textContent?.trim();
    if (text) {
      codeList.push(text);
    } else {
      logger.warn(`No text content found for option: "${JSON.stringify(option)}"`);
    }
  });

  // remove the pick a local authority option
  //codeList.shift();

  //logger.info(codeList);

  return codeList;
}

/**
 * Fetches and saves ATCO codes into the Atco collection or to a json file.
 *
 * @async
 * @function saveAtcoList
 * 
 * @param {boolean} saveToJson - Whether to save the ATCO codes to a json file
 * @returns {Promise<void>} Nothing, saves the processed data to the Atco collection or json file
 *
 * @see getAtcoCodes
 * @see processAtcoString
 *
 */
async function saveAtcoList(saveToJson: boolean = false): Promise<void> {
  // Check if JSON file already exists when saving to JSON
  if (saveToJson) {
    const jsonFilePath = path.join(path.dirname(__dirname), "data/atco_codes.json");
    if (fs.existsSync(jsonFilePath)) {
      logger.info("ATCO codes JSON file already exists, skipping retrieval and save");
      return;
    }
  }

  const codeList = await getAtcoCodes(); // array of strings
  const processedCodes: ProcessedAtcoCode[] = [];
  for (const code of codeList) {
    try {
      const processedData: ProcessedAtcoCode = await processAtcoString(code); // process 1 code at a time
      processedCodes.push(processedData);
    } catch (error) {
      logger.error(`Failed to process ATCO code "${code}":`, error);
      // Continue processing other codes even if one fails
    }
  }
  
  // all codes processed with no errors
  if (saveToJson) {
    await saveAtcoToJson(processedCodes);
  } else {
    await saveAtcoToDB(processedCodes);
  }
}

/**
 * Processes a single ATCO code into the format code:{location, region}.
 *
 * @async
 * @function processAtcoString
 *
 * @param {RawAtcoString} rawdata - The ATCO code to process
 * @returns {ProcessedAtcoCode} data parsed into the format code:{location, region}
 *
 * @see saveAtcoList
 * 
 *  *  @example
 * const data = "Aberdeenshire / Scotland (630)"
 * // returns {630: {location: Aberdeenshire, region: Scotland}}
 */
async function processAtcoString(rawdata: RawAtcoString): Promise<ProcessedAtcoCode> {
  // example: rawdata = "East Riding of Yorkshire / Yorkshire (220)"
  const location = rawdata.split(" / ")[0]; // 0: "East Riding of Yorkshire", 1: "Yorkshire (220)"
  const region = rawdata.split(" / ")[1]?.split(" (")[0]; // split 10: "Yorkshire", split 11: "220)"
  const atcoNumber = rawdata.split(" / ")[1]?.split(" (")[1]?.slice(0, -1); // split 11: "220)", remove the end bracket -> "220"

  if (!atcoNumber || !location || !region) {
    const errorMsg = `Invalid ATCO code format: "${rawdata}". Expected format: "Location / Region (Code)"`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  const processedData: ProcessedAtcoCode = {};
  processedData[atcoNumber] = { location, region };
  //logger.info(`${atcoNumber}: ${processedData[atcoNumber]}`);

  return processedData;
}

/**
 * Saves the processed ATCO codes to a JSON file.
 *
 * @async
 * @function saveAtcoToJson
 *
 * @param {ProcessedAtcoCode[]} processedCodes - The processed ATCO codes to save to the JSON file
 * @returns {Promise<void>} Nothing, saves the processed data to the JSON file
 *
 * @see processAtcoString
 * @see saveAtcoToDB
 */
async function saveAtcoToJson(processedCodes: ProcessedAtcoCode[]): Promise<void> {
  // Dump the processed codes to a json file
  const jsonData = JSON.stringify(processedCodes, null, 2);
  const filePath = path.join(path.dirname(__dirname), "data/atco_codes.json");
  
  // Ensure the data directory exists
  const dataDir = path.dirname(filePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, jsonData);
  logger.info(`Successfully saved ${processedCodes.length} ATCO codes to ${filePath}`);
}

/**
 * Saves the processed ATCO codes to the Atco collection.
 *
 * @async
 * @function saveAtcoToDB
 *
 * @param {ProcessedAtcoCode[]} processedCodes - The processed ATCO codes to save to the Atco collection
 * @returns {Promise<void>} Nothing, saves the processed data to the Atco collection
 *
 * @see processAtcoString
 * @see saveAtcoToJson
 * 
 */
async function saveAtcoToDB(processedCodes: ProcessedAtcoCode[]): Promise<void> {
  for (const processedCode of processedCodes) {
    const atcocode : AtcoCode = Object.keys(processedCode)[0] as AtcoCode;
    const { location, region } : AtcoCodeInfo = processedCode[atcocode] as AtcoCodeInfo;

    const existingAtco = await Atco.exists({ code: atcocode }); // can filter for e.g. busstops.length === 0 to check for empty codes
    if (existingAtco) {
      //logger.info(`ATCO ${atco} already exists in db`);
      return; // skip creating another Atco for no reason.
    }

    await Atco.create({
      code: atcocode,
      region: region,
      location: location,
      busstops: [],
      AllProcessed: false,
    });
  }
  logger.info(`Saved ${processedCodes.length} ATCO codes to the Atco collection`);
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
