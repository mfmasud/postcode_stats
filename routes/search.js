const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const auth = require("../controllers/auth");
const router = Router({ prefix: "/api/v1/search" });
const mongoose = require("mongoose");

// models
const User = require("../models/User");
const Role = require("../models/Role");
const Postcode = require("../models/Postcode");
const Search = require("../models/Search");

// permissions
const createAbilityFor = require("../permissions/search");

// helpers
const { getPostcode, validatePostcode } = require("../helpers/postcode");
const {
    getRelatedStops,
    getRelatedCrimes,
    linkAtco,
} = require("../helpers/search");

router.post("/", auth, bodyParser(), searchArea); // search for details of a lat and long area
router.get("/:postcode", auth, searchPostcode); // searches by lat and long internally
router.get("/random", auth, searchRandom); // admins only - for testing

async function searchArea(cnx) {
    // allows anyone to search via a lat and long in the body of the request
    // returns a list of property listings, transport nodes and crime.

    // no validation on the lat and long for now
    const { latitude, longitude } = cnx.request.body;

    const lat = latitude;
    const long = longitude;
    console.log(`lat: ${lat} long: ${long}`);

    if (!lat || !long) {
        cnx.status = 400;
        cnx.body = "Please provide latitude and longitude values.";
        return;
    }

    let { user } = cnx.state;
    if (!user) {
        user = User({ role: Role({ name: "none" }) });
    }
    const ability = createAbilityFor(user);

    if (ability.can("read", "Search")) {
        // reverse lookup lat long to postcode to generate data for postcode field

        cnx.body = `lat: ${lat} long: ${long}`;
    } else {
        cnx.status = 403;
        cnx.body = "You are not authorised to view this resource";
    }
}

async function searchPostcode(cnx) {
    // allows anyone to search via a postcode - dangerous as they can currently enter anything here.
    // returns a list of property listings, transport nodes and crime.

    let { postcode } = cnx.params;

    if (!postcode) {
        cnx.status = 400;
        cnx.body = "Please provide a postcode.";
        return;
    } else if (postcode === "random") {
        // temporary workaround
        // in the future, postcode should be from the body instead of a path param
        await searchRandom(cnx);
        return;
    }

    let { user } = cnx.state;
    if (!user) {
        user = User({ role: Role({ name: "none" }) });
    }
    const ability = createAbilityFor(user);

    if (ability.can("read", "Search")) {
        const validPostcode = await validatePostcode(postcode);

        if (validPostcode) {
            const processedPostcode = await getPostcode(postcode);
            const dbPostcode = await Postcode.findOne({
                postcode: processedPostcode.postcode,
            });

            // check for existing search by comparing latitude
            const existingSearch = await Search.findOne({
                latitude: dbPostcode.latitude,
            });
            if (!existingSearch) {
                console.log("Saving new Search");
                // save the search to the database
                const newSearch = new Search({
                    Postcode: dbPostcode,
                    reverseLookup: true,
                    latitude: dbPostcode.latitude,
                    longitude: dbPostcode.longitude,
                    Northing: dbPostcode.northings,
                    Easting: dbPostcode.eastings,
                });
                await newSearch.save();
                await linkAtco(newSearch);
                await getRelatedStops(newSearch); // get all bus stops for location and link to search model
                await getRelatedCrimes(newSearch); // get all crimes for location and link to search model
            } else {
                console.log(
                    "Existing search found, ID:",
                    existingSearch.searchID
                );
            }

            const SearchModel = await Search.findOne({
                latitude: dbPostcode.latitude,
            }).populate(["Postcode", "queryBusStops"]);
            const body = SearchModel;
            cnx.status = 200;
            cnx.body = body;
        } else {
            cnx.status = 400;
            cnx.body = "Please provide a valid postcode.";
        }
    } else {
        cnx.status = 403;
        cnx.body = "You are not authorised to view this resource";
    }
}

async function searchRandom(cnx) {
    //admins only
    cnx.status = 404;
}
module.exports = router;
