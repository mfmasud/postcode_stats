const Search = require("../models/Search");
const BusStop = require("../models/BusStop");
const Nptg = require("../models/Nptg");
const Atco = require("../models/Atco");

const {queryAtco} = require("../helpers/AtcoCodes");
const { getCrimeData } = require("../helpers/crime"); // can be switched to a model later

const axios = require("axios");
const csvtojson = require("csvtojson");
const mongoose = require("mongoose");

async function getRelatedStops(SearchModel, radius = 1000) {
    // bus stops around a 1km radius from a given point. maximum returned should be 4 points (arbitrary numbers)
    const { longitude, latitude, Northing, Easting } = SearchModel;

    let linkedAtco = await SearchModel.populate("linkedATCO");
    linkedAtco = linkedAtco.linkedATCO;

    // for java : https://stackoverflow.com/questions/22063842/check-if-a-latitude-and-longitude-is-within-a-circle
    // first check if there are latitude/ longitude for the query bus stop then search within the radius from SearchModel.latitude / longitude
    // just returning first 5 for now...
    // Need to convert BNG to lat/long for empty values or search using BNG instead.

    if (linkedAtco){
        SearchModel.queryBusStops = linkedAtco.busstops.slice(0, 5);
    }
    
    await SearchModel.save();

}

async function getRelatedCrimes(SearchModel) {
    const { latitude, longitude } = SearchModel;
    if (latitude && longitude) {
        await getCrimeData(latitude, longitude);
        // SearchModel.queryCrimes = ... // first 5 related crimes
        SearchModel.queryCrimes = [];
    } else {
        SearchModel.queryCrimes = [] // empty to indicate not found
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

    const linkedAtco = await searchAtco(SearchModel.Postcode);
    if (!linkedAtco){
        return;
    }

    SearchModel.linkedATCO = linkedAtco;
    await SearchModel.save();

}

/**
 * 
 * @param {mongoose.Object} PostcodeModel - The Postcode model object
 * @returns {mongoose.Object} The Atco model object to link to the Search
 */
async function searchAtco(PostcodeModel) {

    const { admin_county, admin_district, parliamentary_constituency, region } = PostcodeModel;
    //console.log(admin_county, admin_district, region);

    const pc = parliamentary_constituency;

    // starting to look ugly - maybe use functions or switch/case
    if (!admin_county) {
        console.log("No admin county");

        if (!admin_district) {
            // no admin district
            console.log("No admin district");
        } else {
            // admin district exists
            var AtcoToLink = await Atco.findOne({ location: admin_district});
            if (!AtcoToLink) {
                AtcoToLink = await Atco.findOne({other_names: admin_district});
            }

            if (region === "London") {
                /*
                example: Lambeth - Local Authority / London Borough
        
                Postcode API data:
                Region: London
                admin_district: Lambeth
        
                In the ATCO List, this is part of "Greater London".

                This also includes postcodes in the City of London (e.g. E1 7DA)
                */
                var AtcoToLink = await Atco.findOne({ location: "Greater London" });
            }

            if (!AtcoToLink && pc) {
                // parlimentiary constituency, e.g. Poole (South West)
                var AtcoToLink = await Atco.findOne({ location: pc});
                if (!AtcoToLink) {
                    AtcoToLink = await Atco.findOne({other_names: pc});
                }
            }

        }

    } else {
        // admin county exists
        var AtcoToLink = await Atco.findOne({ location: admin_county});
        if (!AtcoToLink) {
            AtcoToLink = await Atco.findOne({other_names: admin_county});
        }
    }

    if (AtcoToLink) {
        // match found
        console.log("Matching ATCO:", AtcoToLink.code);
        await queryAtco(AtcoToLink.code);
        return AtcoToLink;
    } else {
        console.log("Matching ATCO not found");
        return;
    }

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
