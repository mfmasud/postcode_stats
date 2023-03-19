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

router.post("/", auth, bodyParser(), searchArea); // search for details of a lat and long area
router.get("/:postcode", auth, searchPostcode); // searches by lat and long internally

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
                postcode: processedPostcode.postcode
            });
            console.log(dbPostcode)

            // save the search to the database - can be separated / cached in the future.
            const search = new Search({
                Postcode: dbPostcode,
                reverseLookup: true, // since we are deriving the lat and long from the postcode
                latitude: dbPostcode.latitude,
                longitude: dbPostcode.longitude,
            });
            await search.save();

            const body = await Search.findOne( {latitude: dbPostcode.latitude}).populate("Postcode");

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

module.exports = router;
