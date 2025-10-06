/**
 * @file Contains the main search routes for the API, allowing users to search for a postcode/lat-long pair and get related stops and crimes.
 * @module routes/search
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires @koa/router
 * @requires koa-bodyparser
 * @requires controllers/auth
 * @requires utils/logger
 * @requires ajv
 * @requires models/User
 * @requires models/Role
 * @requires models/Postcode
 * @requires models/Search
 * @requires schemas/latlong
 * @requires permissions/search
 * @requires helpers/postcode
 * @requires helpers/search
 *
 * @exports router
 */

import Router from "@koa/router"
import bodyParser from "koa-bodyparser"
import auth from "../controllers/auth"
const router = new Router({ prefix: "/api/v1/search" })

import logger from "../../utils/logger"
import Ajv from "ajv"
const ajv = new Ajv()

// routes
router.get("/", auth, bodyParser(), searchArea) // GET - finds a postcode internally using latitude and longitude from the query parameters
router.post("/", auth, bodyParser(), searchPostcode) // POST - verifies and searches using postcode from the request body
router.get("/random", auth, searchRandom) // admins only - for testing

module.exports = router
