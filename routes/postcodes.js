const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const auth = require("../controllers/auth");
const router = Router({ prefix: "/api/v1/postcodes" });

const User = require("../models/User");
const Role = require("../models/Role");
const Postcode = require("../models/Postcode");

const mongoose = require("mongoose");
const createAbilityFor = require("../permissions/postcodes");

const postcode = require("../helpers/postcode");

router.get("/", auth, getAllPostcodes); // allows admins to view all the postcodes that have been saved
router.get("/random", auth, getRandomPostcode); // only authenticated users can access this route

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

async function getRandomPostcode(cnx) {
    
    const { user } = cnx.state;
    if (!cnx.state.user) {
        cnx.status = 401;
        console.error("[401] User needs to log in.");
        cnx.body = { message: "You are not logged in." };
        return;
      }
    const ability = createAbilityFor(user);

    if (ability.can("read", "Postcode")) {
        const randompostcode = await postcode.getRandomPostcode();
        cnx.status = 200;
        console.log("returned postcode", randompostcode.postcode)
        cnx.body = randompostcode;
    } else {
        cnx.status = 403;
        cnx.body = "You are not authorised to view this resource";
    }

}


module.exports = router;
