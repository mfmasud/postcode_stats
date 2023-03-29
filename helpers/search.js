const Search = require("../models/Search");
const BusStop = require("../models/BusStop");
const Nptg = require("../models/Nptg");

const { getCrimeData } = require("../helpers/crime"); // can be switched to a model later

const axios = require("axios");
const csvtojson = require("csvtojson");

async function getRelatedStops(SearchModel, radius = 1000) {
    // bus stops around a 1km radius from a given point. maximum returned should be 4 points (arbitrary numbers)
    const { longitude, latitude, Northing, Easting } = SearchModel;

    /*
    console.log(longitude, postcode.longitude);
    console.log(latitude, postcode.latitude);
    console.log(Easting, postcode.eastings);
    console.log(Northing, postcode.northings);
    */

    console.log(
        "Going to find related stuff here by looking up postcode details / region name etc"
    );

    // for java : https://stackoverflow.com/questions/22063842/check-if-a-latitude-and-longitude-is-within-a-circle

    // updates related search object with matching lat/long Easting/Northing.
    // Need to find the right ATCO for the given search. LinkATCO function?
}

async function getRelatedCrimes(SearchModel) {
    const { latitude, longitude } = SearchModel;
    await getCrimeData(latitude, longitude);
    return;
}

async function getRelatedListings(SearchModel) {
    return;
}

async function linkAtco(SearchModel) {
    // links Search model to correct ATCO from available information.
    // Should be run when search is created / postcode is updated.
    // Tricky as there are no standard ways to do this? NptgLocalityCode?

    await searchAtco(SearchModel.Postcode);
}

async function searchAtco(PostcodeModel) {
    /*
    order to search for ATCOs: (in postcode object of searchmodel)
    admin_county
    admin_district
    */
}

async function getNptgData() {
    const url = "https://naptan.api.dft.gov.uk/v1/nptg/localities";

    const response = await axios.get(url);
    const data = response.data;

    await processNptgCSV(data);
}

async function processNptgCSV(rawdata) {
    // check if Nptg collection is empty
    const count = await Nptg.countDocuments();
    if (count > 0) {
        console.log("Nptg data already saved.");
        return;
    } else {
        console.log("Processing Nptg data...");
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

    const filtered = data.map((row) => {
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

        // console.log(newNptg);

        try {
            await newNptg.save();
            //console.log(`Saved Nptg code ${Nptg.NptgLocalityCode} to Nptg collection`);
        } catch (error) {
            console.error(error);
        }
    }

    console.log("Nptg data saved.");
}

module.exports = {
    getRelatedStops,
    getRelatedCrimes,
    linkAtco,
    getNptgData,
};
