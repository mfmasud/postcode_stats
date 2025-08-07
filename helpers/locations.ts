/**
 * @file This file contains the functions for getting location data from online sources and saving NPTG API data.
 * @module helpers/locations
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires models/Nptg
 * @requires models/Atco
 * @requires utils/logger
 * @requires axios
 * @requires jsdom
 * @requires csvtojson
 *
 * @exports getScotlandLocations
 * @exports getEnglandLocations
 * @exports getWalesLocations
 * @exports getNptgData
 *
 */

import Nptg from "../models/Nptg.js";
import Atco from "../models/Atco.js";

import logger from "../utils/logger.js";

import axios from "axios";
import { JSDOM } from "jsdom";
import csvtojson from "csvtojson";

/**
 * Processes the names for the 32 local goverments of Scotland in order to match the names from the government Atco list.
 *
 * @async
 * @function getScotlandLocations
 *
 * @returns {string[]} A list of strings used by the wikipedia page.
 *
 * @see getEnglandLocations
 * @see getWalesLocations
 *
 */
async function getScotlandLocations() {
  const url = "https://en.wikipedia.org/wiki/Local_government_in_Scotland";
  const response = await axios.get(url);
  const dom = new JSDOM(response.data);

  const locations = dom.window.document.querySelectorAll("ol li a");

  const names = [];

  for (let index = 0; index < 32; index++) {
    const place = locations[index];
    let text = place?.textContent?.trim();
    if (!text) {
      logger.error("No text content found for place", place);
      continue;
    }

    // add alt names to ATCO list. e.g. other_names: Na h-Eileanan Siar
    // make this into a function? normalname - altnames
    if (text === "Orkney") {
      const altname = "Orkney Islands";
      const altAtco = await Atco.findOne({ location: altname });
      if (altAtco) {
        await Atco.findOneAndUpdate(
          { location: altname },
          { $addToSet: { other_names: { $each: [text, "Orkney"] } } }
        );
      }
      text = altname;
    } else if (text === "Shetland") {
      const altname = "Shetland Islands";
      const altAtco = await Atco.findOne({ location: altname });
      if (altAtco) {
        await Atco.findOneAndUpdate(
          { location: altname },
          {
            $addToSet: {
              other_names: { $each: [text, "Shetland"] },
            },
          }
        );
      }
      text = altname;
    } else if (text === "Na h-Eileanan Siar") {
      const altname = "Western Isles";
      const altAtco = await Atco.findOne({ location: altname });
      if (altAtco) {
        await Atco.findOneAndUpdate(
          { location: altname },
          {
            $addToSet: {
              other_names: {
                $each: [
                  text,
                  "Western Islands",
                  "Outer Hebrides",
                  "Comhairle nan Eilean Siar",
                ],
              },
            },
          }
        );
      }
      text = altname;
    } else if (text === "Argyll and Bute") {
      const altname = "Argyll & Bute";
      const altAtco = await Atco.findOne({ location: altname });
      if (altAtco) {
        await Atco.findOneAndUpdate(
          { location: altname },
          {
            $addToSet: {
              other_names: { $each: [text, "Argyll and Bute"] },
            },
          }
        );
      }
      text = altname;
    } else if (text === "Dumfries and Galloway") {
      const altname = "Dumfries & Galloway";
      const altAtco = await Atco.findOne({ location: altname });
      if (altAtco) {
        await Atco.findOneAndUpdate(
          { location: altname },
          {
            $addToSet: {
              other_names: {
                $each: [text, "Dumfries and Galloway"],
              },
            },
          }
        );
      }
      text = altname;
    }

    names.push(text);
  }

  return names;
}

/**
 * Processes online sources to assign alt names to English Atco locations.
 * e.g. the region "London" > City of London and London Boroughs as alt names
 *
 * @async
 * @function getEnglandLocations
 *
 * @returns {string[]} A list of English locations matching the ones in the government Atco list.
 *
 * @see getScotlandLocations
 * @see getWalesLocations
 *
 */
async function getEnglandLocations() {
  // unitary authorities
  const UA_url =
    "https://www.ons.gov.uk/aboutus/transparencyandgovernance/freedomofinformationfoi/alistofunitaryauthoritiesinenglandwithageographicalmap";
  const UA_response = await axios.get(UA_url);
  const UA_data = new JSDOM(UA_response.data);

  // Example: Bournemouth, Christchurch and Poole
  // Bournemouth and Poole are separate in the ATCO list, so not foolproof yet.

  // ceremnonial counties
  // https://raw.githubusercontent.com/ideal-postcodes/postcodes.io/master/data/counties.json
  const county_url =
    "https://en.wikipedia.org/wiki/Ceremonial_counties_of_England";
  const county_response = await axios.get(county_url);
  const county_data = new JSDOM(county_response.data);

  // to be added to Greater London altnames
  // Also includes City of London as a borough.
  const london_url = "https://en.wikipedia.org/wiki/London_boroughs";
  const london_response = await axios.get(london_url);
  const london_data = new JSDOM(london_response.data);

  const english_places: string[] = [];

  logger.info(english_places);

  return english_places;
}

/**
 * Processes the wikipedia page on Welsh local governments to assign alt names to Wales Atco locations.
 *
 * @async
 * @function getWalesLocations
 *
 * @returns {string[]} A list of Welsh locations from Wikipedia, matching the ones in the government supplied local authority Atco list.
 *
 * @see getScotlandLocations
 * @see getEnglandLocations
 *
 */
async function getWalesLocations() {
  // https://en.wikipedia.org/wiki/Local_government_in_Wales#Principal_areas

  const url =
    "https://en.wikipedia.org/wiki/Local_government_in_Wales#Principal_areas";
  const response = await axios.get(url);
  const dom = new JSDOM(response.data);

  const tabledata = dom.window.document.querySelectorAll(
    "table.wikitable li a"
  );

  const names: string[] = [];

  for (const li of tabledata) {
    const name = li?.textContent?.trim();
    if (name) {
      names.push(name);
    } else {
      logger.error("No text content found for li", li);
    }
  }

  //logger.info(names)
  return names.slice(0, 22);
}

/**
 * Downloads and processes the National Public Transport Gazetteer (NPTG) dataset from Naptan.
 *
 * @async
 * @function getNptgData
 *
 * @see processNptgCSV
 *
 */
async function getNptgData() {
  // Nptg could potentially be used as a fallback for finding location names
  const url = "https://naptan.api.dft.gov.uk/v1/nptg/localities";

  const response = await axios.get(url);
  const data = response.data;

  await processNptgCSV(data);
}

/**
 * Processes the NPTG API csv data.
 * Checks for an existing cache to ensure data is not needlessly re-downloaded.
 *
 * @async
 * @function processNptgCSV
 *
 * @param {Object} rawdata - The raw CSV data returned from getNptgData.
 * @returns Nothing, processed the data in the CSV and stores it in the Nptg collection.
 *
 * @see getNptgData
 *
 * @todo Speed this up like the code used to save BusStops and Crimes.
 *
 */
async function processNptgCSV(rawdata: string) {
  // check if Nptg collection is empty
  const count = await Nptg.estimatedDocumentCount();
  if (count >= 43876) {
    logger.info(`Nptg data already saved. All ${count} records found.`);
    return;
  } else {
    logger.info(`${count}/43876 records found. Processing Nptg data...`);
  }

  // adatped from AtcoCodes.processCSV()
  const data = await csvtojson().fromString(rawdata);

  // filter through columns
  const columns = [
    "NptgLocalityCode",
    "LocalityName",
    "ParentLocalityName",
    "Northing",
    "Easting",
    "QualifierName",
  ];

  const NptgBulk = data.map(row => {
    const doc = Object.fromEntries(columns.map(col => [col, row[col]]));

    return new Nptg(doc);
  });

  try {
    await Nptg.insertMany(NptgBulk, { ordered: false, skipDuplicates: true });
  } catch (error: any) {
    if (error.code === 11000) {
      logger.info("Duplicate NPTG locality codes found. Skipping duplicates.");
    } else {
      logger.error(error);
    }
  }

  const finalCount = await Nptg.estimatedDocumentCount();
  logger.info(`NPTG data processed. Found ${finalCount} records.`);
}

export {
  getScotlandLocations,
  getEnglandLocations,
  getWalesLocations,
  getNptgData,
};
