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
const { validatePostcode } = require("../helpers/postcode");

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

    if (ability.can("read", "Listing")) {
        cnx.body = `lat: ${lat} long: ${long}`;
    } else {
        cnx.status = 403;
        cnx.body = "You are not authorised to view this resource";
    }
}

async function searchPostcode(cnx) {
    // allows anyone to search via a postcode - dangerous as they can currently enter anything here.
    // returns a list of property listings, transport nodes and crime.

	const { postcode } = cnx.params;
	console.log(postcode)

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

    if (ability.can("read", "Listing")) {

        const validPostcode = await validatePostcode(postcode);

        // lookup Postcode and return lat long from object
        // e.g. queryPostcode helper function
    } else {
        cnx.status = 403;
        cnx.body = "You are not authorised to view this resource";
    }
}

module.exports = router;
