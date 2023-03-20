const Search = require("../models/Search");
const BusStop = require("../models/BusStop");
const Nptg = require("../models/Nptg");

const axios = require("axios");

async function getRelatedStops(lat, long, radius=1000) {
    // bus stops around a 1km radius from a given point. maximum returned should be 4 (arbitrary numbers)

    // for java : https://stackoverflow.com/questions/22063842/check-if-a-latitude-and-longitude-is-within-a-circle

    // updates related search object with matchin lat/long.
    // Need to find the right ATCO for the given search. LinkATCO function?
}

async function linkATCO() {
    // links Search model to correct ATCO from available information.
    // Tricky as there are no standard ways to do this? NptgLocalityCode?
}

async function getNptgData() {
    const url = "https://naptan.api.dft.gov.uk/v1/nptg/localities";

    const response = await axios.get(url);
    const data = response.data;

    await processNptgCSV(data);
}

async function processNptgCSV(rawdata) {
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
  
    const filtered = active.map((row) => {
      const filteredRow = {}; // create empty object to store new filtered records in
      columns.forEach((column) => {
        // for each column in columns
        filteredRow[column] = row[column]; // add column:value pair to filteredRow
      });
      return filteredRow; // add back to filtered array
    });

    for (const row of filtered) {
      //console.log(row);
      const newNptg = new Nptg({
        NptgLocalityCode: row.NptgLocalityCode,
        LocalityName: row.LocalityName,
        ParentLocalityName: row.ParentLocalityName,
        Northing: row.Northing,
        Easting: row.Easting,
        QualifierName: row.QualifierName,
      });
      
      try {
        await Nptg.save();
        //console.log(`Saved Nptg code ${Nptg.NptgLocalityCode} to Nptg collection`);
      } catch (error) {
        console.error(error);
      }
    };
  }

module.exports = {
    getRelatedStops,
    linkATCO,
}
