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

async function getAllPostcodes(ctx) {

    const { user } = ctx.state;
    const ability = createAbilityFor(user);

    if (ability.can("readAll", "Postcode")) {
        const postcodes = await Postcode.find();
        ctx.body = postcodes;
    } else {
        ctx.status = 403;
        ctx.body = "You are not authorised to view this resource";
    }
}

async function getRandomPostcode(ctx) {
    const randompostcode = await postcode.getRandomPostcode();

    if (ability.can("read", "Postcode")) {
        ctx.status = 200;
        ctx.body = randompostcode;
    } else {
        ctx.status = 403;
        ctx.body = "You are not authorised to view this resource";
    }

}


module.exports = router;
