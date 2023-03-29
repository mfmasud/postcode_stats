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
const BusStop = require("../models/BusStop");

async function getAtcoCodes() {
    const url = "https://beta-naptan.dft.gov.uk/download/la";
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

async function saveAtcoList() {
    // run on db initialisation to get a list of searchable ATCOs.
    const codeList = await getAtcoCodes();
    for (code of codeList) {
        await processAtco(code);
    }
}

// process atco codes as atco:{location, region}
async function processAtco(data) {
    // example string: Aberdeenshire / Scotland (630)
    // result: {630: {location: Aberdeenshire, region: Scotland}}

    const location = data.split(" / ")[0];
    const region = data.split(" / ")[1].split(" (")[0];
    const atco = data.split(" / ")[1].split(" (")[1].split(")")[0];

    const processedData = {};
    processedData[atco] = { location, region };
    //console.log(atco, processedData[atco]);

    const existingAtco = await Atco.findOne({ code: atco }); // can filter for e.g. busstops.length === 0 to check for empty codes
    if (existingAtco) {
        //console.log(`ATCO ${atco} already exists in db`);
        return; // skip creating another Atco for no reason.
    }

    const newAtco = await Atco.create({
        code: atco,
        region: region,
        location: location,
        busstops: [],
    });

    //console.log(`ATCO ${newAtco.code} created in database`);
}

// API for transport nodes: https://naptan.api.dft.gov.uk/swagger/index.html
// example api call: https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv&atcoAreaCodes=420
// 420 is Warwickshire / West Midlands.

async function queryAtco(code) {
    // backend function to query the API for bus stops
    // run when linking ATCOs to searches (to find bus stops).
    // basic validation - not meant to be complete
    format = "csv";
    code = code.toString();

    const api = "https://naptan.api.dft.gov.uk/v1/access-nodes";
    const query = `dataFormat=${format}&atcoAreaCodes=${code}`;
    // Note: If no codes are specified, the download size will be 100Mb - The whole dataset.

    try {
        const response = await axios.get(`${api}?${query}`);
        // response is raw csv data, not an object should be cached and parsed into json

        if (format === "csv") {
            const AtcoExists = await Atco.findOne({ code: code });
            if (AtcoExists.busstops.length > 1) {
                console.log(
                    `ATCO ${code} BusStops found, not processing any further.`
                );
                return;
            } else {
                console.log("processing ATCO code:", code);
                await processCSV(code, response.data);
                console.log("finished processing ATCO:", code);
                return;
            }
        } else {
            console.log("Invalid format");
            return;
        }
    } catch (error) {
        console.error(error);
    }
}

async function processCSV(code, rawdata) {
    // this can take a while, should be run on startup of the server so users use cached mongodb models instead
    const associatedAtco = await Atco.findOne({ code: code });

    // parse csv using csvtojson
    const data = await csvtojson().fromString(rawdata);
    //console.log(data);
    // data is an array of objects e.g. dictionary of column:value pairs

    // filter out data to just bus stops
    const busstops = data.filter((row) => row.StopType === "BCT" && row.Status === "active" && row.Northing && row.Easting);
    // can also filter to city level at this stage, by finding the right column. "430" has 15,000 values to process ...

    // BNG can be converted to lat long if needed to simplify calculations.

    // filter through columns - can remove NaptanCode later if it remains unused.
    const columns = [
        "ATCOCode",
        "CommonName",
        "Street",
        "Longitude",
        "Latitude",
        "Northing",
        "Easting",
    ];

    const filtered = busstops.map((row) => {
        // for each row in the filtered busstops array
        const filteredRow = {}; // create empty object to store new filtered records in
        columns.forEach((column) => {
            // for each column in columns
            filteredRow[column] = row[column]; // add column:value pair to filteredRow
        });
        return filteredRow; // add back to filtered array
    });

    // store each result in BusStop collection
    for (const row of filtered) {
        //console.log(row);

        const existingBusStop = await BusStop.findOne({ATCO_long: row.ATCOCode});
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

        associatedAtco.busstops.push(newBusStop);

        try {
            await newBusStop.save();
            await associatedAtco.save();
            //console.log(`Saved ATCO code ${newBusStop.ATCO_long} to BusStop collection`);
            //console.log(`debug: ${associatedAtco.busstops.length}`)
        } catch (error) {
            console.error(error);
        }
    }
}

module.exports = {
    getAtcoCodes,
    queryAtco,
    processAtco,
    saveAtcoList,
};
