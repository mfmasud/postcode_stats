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
const { getPostcode, getRandomPostcode, validatePostcode } = require("../helpers/postcode");
const {
    getRelatedStops,
    getRelatedCrimes,
    linkAtco,
} = require("../helpers/search");

router.post("/", auth, bodyParser(), searchArea); // POST - finds a postcode internally
router.get("/", auth, bodyParser(), searchPostcode); // GET - verifies and searches using postcode from the request body
router.get("/random", auth, searchRandom); // admins only - for testing

async function searchArea(cnx) {
    // POST and latitude/longitude in query params
    // allows anyone to search via a lat and long in the body of the request
    // returns a list of property listings, transport nodes and crime.

    // no validation on the lat and long for now
    const { latitude, longitude } = cnx.query;

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
        // await FindPostcode with lat long
        // await getPostcode with postcode

        cnx.body = `lat: ${lat} long: ${long}`;
    } else {
        cnx.status = 403;
        cnx.body = "You are not authorised to view this resource";
    }
}

async function searchPostcode(cnx) {
    // GET and postcode in body.
    // allows anyone to search via a postcode in the request body.
    // returns a list of property listings, transport nodes and crime data

    let { postcode } = cnx.request.body;

    if (!postcode) {
        cnx.status = 400;
        cnx.body = "Please provide a postcode.";
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
            // invalid postcode
            cnx.status = 400;
            cnx.body = "Please provide a valid postcode.";
        }
    } else {
        cnx.status = 403;
        cnx.body = "You are not authorised to view this resource";
    }
}

async function searchRandom(cnx) {

    let { user } = cnx.state;
    if (!user) {
        user = User({ role: Role({ name: "none" }) });
    }
    const ability = createAbilityFor(user);

    if (ability.can("read", "RandomSearch")) {
            const processedPostcode = await getRandomPostcode();
            const dbPostcode = await Postcode.findOne({
                postcode: processedPostcode.postcode,
            });

            // check for existing search by comparing latitude - Extremely unlikely as random postcodes are generated
            const existingSearch = await Search.findOne({
                latitude: dbPostcode.latitude,
            });

            if (!existingSearch) {
                console.log("Saving new Random Search");
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
        cnx.status = 403;
        cnx.body = "You are not authorised to view this resource";
    }
}
module.exports = router;
