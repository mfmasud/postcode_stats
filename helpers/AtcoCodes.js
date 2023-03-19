/*
web scraping and parsing HTML in javascript:
https://www.twilio.com/blog/web-scraping-and-parsing-html-in-node-js-with-jsdom

related note:
docs/notes/atco_codes.txt
*/

const axios = require("axios");
const JSDOM = require("jsdom").JSDOM;
const csvtojson = require("csvtojson");

const Atco = require("../models/Atco");
const BusStop = require("../models/BusStop")

// URL has a dropdown with all the local authorities and ATCO codes
const url = "https://beta-naptan.dft.gov.uk/download/la";

async function getAtcoCodes() {
  const response = await axios.get(url);
  const dom = new JSDOM(response.data);

  const options = dom.window.document.querySelectorAll(
    "#localAuthorityName option"
  );

  const codes = [];

  options.forEach((option) => {
    const text = option.textContent.trim();
    codes.push(text);
  });

  codes.shift();

  return codes;
}

// process atco codes as atco:{location, region}
function processAtco(data) {
  // example string: Aberdeenshire / Scotland (630)
  // result: {630: {location: Aberdeenshire, region: Scotland}}

  const location = data.split("/")[0];
  const region = data.split("/")[1].split("(")[0];
  const atco = data.split("/")[1].split("(")[1].split(")")[0];

  const processedData = {};
  processedData[atco] = { location, region };

  return processedData;
}

// API for transport nodes: https://naptan.api.dft.gov.uk/swagger/index.html
// example api call: https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv&atcoAreaCodes=420
// 420 is Warwickshire / West Midlands.

async function queryAtco(format = "csv", code) {
  // backend function to query the API for bus stops
  // basic validation - not meant to be complete
  format = format.toString();
  code = code.toString();

  const api = "https://naptan.api.dft.gov.uk/v1/access-nodes";
  const query = `dataFormat=${format}&atcoAreaCodes=${code}`;

  try {
    const response = await axios.get(`${api}?${query}`);
    // response is raw csv data, not an object should be cached and parsed into json

    if (format === "csv") {
      // TODO: Can check if already processed here
      await processCSV(code, response.data);
      return;
    } else {
      console.log("Invalid format");
      return;
    }
  } catch (error) {
    console.error(error);
  }
}

async function processCSV(code, rawdata) {
  // parse csv using csvtojson
  const data = await csvtojson().fromString(rawdata);
  //console.log(data);
  // data is an array of objects e.g. dictionary of column:value pairs

  // filter out bus stops
  const busstops = data.filter((row) => row.StopType === "BCT");

  // filter out bus stops that are not active
  const active = busstops.filter((row) => row.Status === "active");

  // filter through columns
  const columns = [
    "ATCOCode",
    "NaptanCode",
    "CommonName",
    "Street",
    "LocalityName",
    "ParentLocalityName",
    "Longitude",
    "Latitude",
    "Status",
  ];

  const filtered = active.map((row) => {
    // for each row in the active busstops array
    const filteredRow = {}; // create empty object to store new filtered records in
    columns.forEach((column) => {
      // for each column in columns
      filteredRow[column] = row[column]; // add column:value pair to filteredRow
    });
    return filteredRow; // add back to filtered array
  });

  // first 4 records as test
  //console.log(filtered.slice(0, 4));
  //console.log(filtered);

  // store each result in BusStop collection
  filtered.forEach((row) => {
    const newBusStop = new BusStop({
      ATCO_long: row.ATCOCode,
      ATCO_short: code,
      NaptanCode: row.NaptanCode,
      CommonName: row.CommonName,
      Street: row.Street,
      LocalityName: row.LocalityName,
      ParentLocalityName: row.ParentLocalityName,
      Longitude: row.Longitude,
      Latitude: row.Latitude,
      Status: row.Status,
    });

    try {
      newBusStop.save();
      console.log(`Saved ATCO code ${newBusStop.ATCO_long} to BusStop collection`);
    } catch (error) {
      console.error(error);
    }
  });
}

module.exports = {
  getAtcoCodes,
  queryAtco,
  processAtco,
};
