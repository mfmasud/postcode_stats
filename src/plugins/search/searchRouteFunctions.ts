import logger from "../../utils/logger.js"

// models
import User from "../../models/User.js"
import Role from "../../models/Role.js"
import Postcode from "../../models/Postcode.js"
import Search from "../../models/Search.js"

// schemas
import latlongSchema from "../../schemas/latlong.json" with { type: "json" }
import { Ajv } from "ajv"
const ajv = new Ajv()
const validateLatLong = ajv.compile(latlongSchema)
import {
    type SearchAreaParams,
    type SearchPostcodeParams,
} from "../../schemas/searchSchema.js"

// permissions
import createAbilityFor from "../../permissions/search.js"

// helpers
import {
    findPostcodeFromWGS84,
    getPostcode,
    getRandomPostcode,
    validatePostcode,
} from "../postcode/postcodeHelper.js"
import {
    getRelatedStops,
    getRelatedCrimes,
    linkAtco,
    updateLinks,
} from "./searchHelper.js"

// fastify
import { type FastifyRequest, type FastifyReply } from "fastify"

/**
 * A function which searches location data using a pair of latitude and longitude values in the query parameters.
 *
 * @async
 * @function searchArea
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @throws {Error} 400 if the latitude or longitude values are missing or invalid.
 * @throws {Error} 403 if the user does not have permission to search a location.
 * @throws {Error} 404 if no postcode is found for the provided coordinates.

 * @see {@link findPostcodeFromWGS84} for more information on the function used to find the postcode from the lat-long pair.
 * @see {@link searchPostcode} for more information on the primary function used to search postcodes, used internally in this function.
 *
 * @todo Update the reverseLookup property to be false if the postcode is found via this function.
 *
 */
async function searchArea(request: FastifyRequest, reply: FastifyReply) {
    // GET request with latitude/longitude in query params
    // allows anyone to search via a lat and long in the body of the request
    // returns a list of property listings, transport nodes and crime.

    const { latitude, longitude } = request.params as SearchAreaParams

    const lat = latitude
    const long = longitude

    logger.info(`searching for lat: ${lat} long: ${long}`)

    // Check for empty values
    if (!lat || !long) {
        logger.error("No latitude / longitude value provided")
        reply.status(400).send({
            error: "Bad Request",
            message: "Please provide valid latitude and longitude values.",
        })
        return
    }

    try {
        var latFloat = parseFloat(lat)
        var longFloat = parseFloat(long)
    } catch (error) {
        logger.error(error)
        reply.status(400).send({
            error: "Bad Request",
            message: "Please provide valid latitude and longitude values.",
        })
        return
    }

    const locationObj = { latitude: latFloat, longitude: longFloat }
    //logger.info(locationObj);
    //logger.info(validateLatLong(locationObj));

    // Validate the lat/long values
    if (!validateLatLong(locationObj)) {
        const errorMessages = [
            "Please provide valid latitude and longitude values:",
        ]
        for (const error of validateLatLong.errors) {
            // dataPath below could change in the future
            errorMessages.push(
                `Value for ${error.dataPath.slice(1)} ${error.message}`
            ) // "value for x should be <=y"
        }

        logger.error(
            `Lat/Long validation error: ${JSON.stringify(validateLatLong.errors[0])}`
        )
        reply.status(400).send({
            error: "Bad Request",
            message: errorMessages.join("\n"),
        })
        return
    }

    let { user } = cnx.state
    if (!user) {
        user = User({ role: await Role.findOne({ name: "none" }) })
    }
    const ability = createAbilityFor(user)

    if (ability.can("create", "Search")) {
        // lookup lat long to postcode to generate data for postcode field, then search via postcode

        const findPostcode = await findPostcodeFromWGS84(locationObj)
        if (!findPostcode) {
            reply.status(404).send({
                error: "Not Found",
                message: "No postcode found for provided coordinates.",
            })
        } else {
            request.body.postcode = findPostcode
            await searchPostcode(request, reply)
        }
    } else {
        logger.error("User does not have permission to perform this action.")
        reply.status(403).send({
            error: "Forbidden",
            message: "You are not allowed to access this resource.",
        })
    }
}

/**
 * A function which searches location data using a postcode from the request body.
 *
 * @async
 * @function searchPostcode
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @throws {Error} 400 if the postcode is missing or invalid.
 * @throws {Error} 403 if the user does not have permission to search a location.
 * @returns {undefined} the request is modified with a 200 status code and a body containing the search results.
 *
 * @see {@link validatePostcode} for postcode validation.
 * @see {@link getPostcode} for postcode lookup using the postcodes.io API.
 * @see {@link module:model/Search} for the Search model used.
 * @see {@link module:permissions/search} for the permissions applied to this route.
 *
 */
async function searchPostcode(request: FastifyRequest, reply: FastifyReply) {
    // POST with postcode in the request body.
    // allows anyone to search via a postcode in the request body.
    // returns a list of property listings, transport nodes and crime data

    const { postcode } = request.body as SearchPostcodeParams

    if (!postcode) {
        logger.info("No postcode provided.")
        reply.status(400).send({
            error: "Bad Request",
            message: "Please provide a valid postcode.",
        })
        return
    }

    let { user } = cnx.state
    if (!user) {
        user = User({ role: await Role.findOne({ name: "none" }) })
    }
    const ability = createAbilityFor(user)

    if (ability.can("create", "Search")) {
        const validPostcode = await validatePostcode(postcode)

        if (validPostcode) {
            const processedPostcode = await getPostcode(postcode)
            const dbPostcode = await Postcode.findOne({
                postcode: processedPostcode.postcode,
            })

            // check for existing search by comparing Postcode data
            const existingSearch = await Search.findOne({
                Postcode: dbPostcode,
            }).populate("Postcode")

            if (!existingSearch) {
                logger.info("Saving new Search")
                // save the search to the database
                const newSearch = new Search({
                    Postcode: dbPostcode,
                    reverseLookup: true,
                    latitude: dbPostcode.latitude,
                    longitude: dbPostcode.longitude,
                    Northing: dbPostcode.northings,
                    Easting: dbPostcode.eastings,
                })
                await newSearch.save()
                await linkAtco(newSearch)
                await getRelatedStops(newSearch) // get all bus stops for location and link to search model
                await getRelatedCrimes(newSearch) // get all crimes for location and link to search model
                await updateLinks(request, newSearch) // add resource-describing links
            } else {
                logger.info(
                    `Existing search found, ID: ${existingSearch.searchID}`
                )
                await updateLinks(request, existingSearch)
            }

            const SearchModel = await Search.findOne({
                latitude: dbPostcode.latitude,
            }).populate(["Postcode", "queryBusStops", "queryCrimes"])
            const body = SearchModel
            reply.status(200).send(body)
        } else {
            // invalid postcode
            logger.info("Invalid postcode provided.")
            reply.status(400).send({
                error: "Bad Request",
                message: "Please provide a valid postcode.",
            })
            return
        }
    } else {
        logger.error("User does not have permission to perform this action.")
        reply.status(403).send({
            error: "Forbidden",
            message: "You are not allowed to access this resource.",
        })
        return
    }
}

/**
 * A function which searches location data using a randomly generated postcode.
 * Used for testing purposes, admins only.
 *
 * @async
 * @function searchRandom
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @throws {Error} 403 if the user does not have permission to search a location.
 * @returns {undefined} cnx is modified with a 200 status code and a body containing the random postcode search results.
 *
 * @see {@link getRandomPostcode} for random postcode generation.
 * @see {@link module:model/Search} for the Search model used.
 * @see {@link module:permissions/search} for the permissions applied to this route.
 *
 */
async function searchRandom(request: FastifyRequest, reply: FastifyReply) {
    let { user } = cnx.state
    if (!user) {
        // I could just return here, but this route might be accessible to other roles in the future.
        user = User({ role: await Role.findOne({ name: "none" }) })
    }
    const ability = createAbilityFor(user)

    if (ability.can("create", "RandomSearch")) {
        const processedPostcode = await getRandomPostcode()
        const dbPostcode = await Postcode.findOne({
            postcode: processedPostcode.postcode,
        })

        // check for existing search by comparing Postcode data
        const existingSearch = await Search.findOne({
            Postcode: dbPostcode,
        })

        if (!existingSearch) {
            logger.info("Saving new Random Search")
            // save the search to the database
            const newSearch = new Search({
                Postcode: dbPostcode,
                reverseLookup: true,
                latitude: dbPostcode.latitude,
                longitude: dbPostcode.longitude,
                Northing: dbPostcode.northings,
                Easting: dbPostcode.eastings,
            })

            await newSearch.save()
            await linkAtco(newSearch)
            await getRelatedStops(newSearch) // get all bus stops for location and link to search model
            await getRelatedCrimes(newSearch) // get all crimes for location and link to search model
            await updateLinks(request, newSearch)
        } else {
            logger.info(`Existing search found, ID: ${existingSearch.searchID}`)
            await updateLinks(request, existingSearch)
        }

        const SearchModel = await Search.findOne({
            latitude: dbPostcode.latitude,
        }).populate(["Postcode", "queryBusStops", "queryCrimes"])
        const body = SearchModel
        reply.status(200).send(body)
    } else {
        logger.error("User does not have permission to perform this action.")
        reply.status(403).send({
            error: "Forbidden",
            message: "You are not allowed to access this resource.",
        })
    }
}

export { searchArea, searchPostcode, searchRandom }
