const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const auth = require("../controllers/auth");
const router = Router({ prefix: "/api/v1/postcodes" });

const User = require("../models/User");
const Role = require("../models/Role");
const Postcode = require("../models/Postcode");

const mongoose = require("mongoose");
const createAbilityFor = require("../permissions/postcodes");

const {getPostcode, getRandomPostcode, validatePostcode} = require("../helpers/postcode");

router.get("/", auth, getAllPostcodes); // allows admins to view all the postcodes that have been saved
router.get("/random", auth, getRandomPostcodeRoute); // only authenticated users can access this route
router.get("/:postcode", auth, getPostcodeRoute); // Search for specific valid postcode.

async function getAllPostcodes(cnx) {

    const { user } = cnx.state;
    if (!cnx.state.user) {
        cnx.status = 401;
        console.error("[401] User needs to log in.");
        cnx.body = { message: "You are not logged in." };
        return;
      }
    const ability = createAbilityFor(user);

    if (ability.can("readAll", "Postcode")) {
        const postcodes = await Postcode.find();
        cnx.body = postcodes;
    } else {
        cnx.status = 403;
        cnx.body = "You are not authorised to view this resource";
    }
}

async function getRandomPostcodeRoute(cnx) {
    
    const { user } = cnx.state;
    if (!cnx.state.user) {
        cnx.status = 401;
        console.error("[401] User needs to log in.");
        cnx.body = { message: "You are not logged in." };
        return;
      }
    const ability = createAbilityFor(user);

    if (ability.can("read", "Postcode")) {
        const randompostcode = await getRandomPostcode();
        cnx.status = 200;
        console.log("returned postcode", randompostcode.postcode)
        cnx.body = randompostcode;
    } else {
        cnx.status = 403;
        cnx.body = "You are not authorised to view this resource";
    }

}

async function getPostcodeRoute(cnx) {
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

    if (ability.can("read", "Postcode")) {

        const validPostcode = await validatePostcode(postcode);

        if (validPostcode) {
            const body = await getPostcode(postcode);
            cnx.status = 200;
            console.log("returned postcode", body.postcode);
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
