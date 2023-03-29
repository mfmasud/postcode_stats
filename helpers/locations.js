const axios = require("axios");
const JSDOM = require("jsdom").JSDOM;

const Atco = require("../models/Atco");

async function getScotlandLocations() {
    // should only be run once, to add scottish regions and alternative names for the locations.

    const url = "https://en.wikipedia.org/wiki/Local_government_in_Scotland";
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);

    const locations = dom.window.document.querySelectorAll("ol li a");

    const names = [];

    for (let index = 0; index < 32; index++) {
        const place = locations[index];
        var text = place.textContent.trim();

        // add alt names to ATCO list. e.g. other_names: Na h-Eileanan Siar
        if (text === "Orkney") {
            const altname = "Orkney Islands";
            const altAtco = await Atco.findOne({ location: altname });
            await altAtco.other_names.insert(text);
            text = altname;
        } else if (text === "Shetland") {
            const altname = "Shetland Islands";
            const altAtco = await Atco.findOne({ location: altname });
            await altAtco.other_names.insert(text);
            text = altname;
        } else if (text === "Na h-Eileanan Siar") {
            const altname = "Western Isles";
            const altAtco = await Atco.findOne({ location: altname });
            await altAtco.other_names.insert(text); // add the alternative name to the "other_names" array.
            await altAtco.other_names.insert("Western Islands");
            await altAtco.other_names.insert("Outer Hebrides");
            await altAtco.other_names.insert("Outer Hebrides");
            await altAtco.other_names.insert("Comhairle nan Eilean Siar"); // more can be added later or as part of another function which finds and adds alt names.
            text = altname;
        } else if (text === "Argyll and Bute") {
            const altname = "Argyll & Bute";
            const altAtco = await Atco.findOne({ location: altname });
            await altAtco.other_names.insert(text);
            text = altname;
        } else if (text === "Dumfries and Galloway") {
            const altname = "Dumfries & Galloway";
            const altAtco = await Atco.findOne({ location: altname });
            await altAtco.other_names.insert(text);
            text = altname;
        }

        names.push(text);
    }

    //console.log(names);
    // Inverclyde to Shetland - all 32
    // Orkney and Shetland needs to have "Islands" for the list.
    // In the ATCO list, "Western Islands" refers to Na h-Eileanan Siar

    return names;
}

async function getEnglandLocations() {
    // unitary authorities
    const UA_url =
        "https://www.ons.gov.uk/aboutus/transparencyandgovernance/freedomofinformationfoi/alistofunitaryauthoritiesinenglandwithageographicalmap";
    const UA_response = await axios.get(UA_url);
    const UA_data = new JSDOM(UA_response.data);

    const county_url =
        "https://en.wikipedia.org/wiki/Ceremonial_counties_of_England";
    const county_response = await axios.get(county_url);
    const county_data = new JSDOM(county_response.data);

    const english_places = [];

    console.log(english_places);

    return english_places;
}

async function getWalesLocations() {
    // https://en.wikipedia.org/wiki/Local_government_in_Wales#Principal_areas
}

module.exports = {
    getScotlandLocations,
    getEnglandLocations,
};
