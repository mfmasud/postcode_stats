const axios = require("axios");
const JSDOM = require("jsdom").JSDOM;
const mongoose = require("mongoose");

const Atco = require("../models/Atco");

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
