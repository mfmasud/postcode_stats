const Nptg = require("../models/Nptg");
const Atco = require("../models/Atco");

const axios = require("axios");
const JSDOM = require("jsdom").JSDOM;
const mongoose = require("mongoose");
const csvtojson = require("csvtojson");

async function getScotlandLocations() {
    const url = "https://en.wikipedia.org/wiki/Local_government_in_Scotland";
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);

    const locations = dom.window.document.querySelectorAll("ol li a");

    const names = [];

    for (let index = 0; index < 32; index++) {
        const place = locations[index];
        var text = place.textContent.trim();

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

async function getEnglandLocations() {
    // unitary authorities
    const UA_url =
        "https://www.ons.gov.uk/aboutus/transparencyandgovernance/freedomofinformationfoi/alistofunitaryauthoritiesinenglandwithageographicalmap";
    const UA_response = await axios.get(UA_url);
    const UA_data = new JSDOM(UA_response.data);

    // Example: Bournemouth, Christchurch and Poole
    // Bournemouth and Poole are separate in the ATCO list.

    // ceremnonial counties
    // https://raw.githubusercontent.com/ideal-postcodes/postcodes.io/master/data/counties.json
    const county_url =
        "https://en.wikipedia.org/wiki/Ceremonial_counties_of_England";
    const county_response = await axios.get(county_url);
    const county_data = new JSDOM(county_response.data);

    // to be added to Greater London altnames
    // Also includes City of London as a borough.
    const london_url = "https://en.wikipedia.org/wiki/London_boroughs"
    const london_response = await axios.get(london_url)
    const london_data = new JSDOM(london_response.data)

    const english_places = [];

    console.log(english_places);

    return english_places;
}

async function getWalesLocations() {
    // https://en.wikipedia.org/wiki/Local_government_in_Wales#Principal_areas

    const url = "https://en.wikipedia.org/wiki/Local_government_in_Wales#Principal_areas";
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);

    const tabledata = dom.window.document.querySelectorAll('table.wikitable li a');

    const names = [];

    for (li of tabledata) {
        names.push(li.textContent.trim());
    }

    //console.log(names)
    return names.slice(0, 22);
}

async function getNptgData() {
    // Nptg could potentially be used as a fallback for finding location names
    const url = "https://naptan.api.dft.gov.uk/v1/nptg/localities";

    const response = await axios.get(url);
    const data = response.data;

    await processNptgCSV(data);
}

async function processNptgCSV(rawdata) {
    // TODO: speed this up like the code used to save bus stops / ATCOs.

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
    getScotlandLocations,
    getEnglandLocations,
    getWalesLocations,
    getNptgData,
};
