/**
 * @file Contains functions for interacting with the postcodes.io API and processing and saving the data returned.
 * @module helpers/postcode
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires axios
 * @requires utils/logger
 * @requires models/Postcode
 *
 * @exports findPostcodeFromWGS84
 * @exports getRandomPostcode
 * @exports getPostcode
 * @exports validatePostcode
 * @exports processPostcode
 *
 * @see https://postcodes.io/docs
 * @see {@link module:routes/postcodes} for the route which uses this module.
 *
 */

import type { FastifyRequest, FastifyReply } from "fastify"

import axios from "axios"
import createAbilityFor from "../../permissions/postcodes.js"
import logger from "../../utils/logger.js"

import Postcode, { type PostcodeDoc } from "../../models/Postcode.js"
import User, { type UserDoc } from "../../models/User.js"
import Role, { type RoleDoc } from "../../models/Role.js"

import type { PostcodeParams } from "../../schemas/postcodeSchema.js"
import type { LocationPair } from "../../types/postcode.js"

// === Routing ===

/**
 * Allows admins (or anyone who can "readAll" "Postcode" objects) to view all the postcodes that have been saved in the `Postcodes` collection.
 *
 * @async
 * @function getAllPostcodes
 *
 * @param {FastifyRequest} request - The Fastify request object containing the request information.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @throws {Error} 400 if the request is invalid.
 * @throws {Error} 401 if the user is not logged in.
 * @throws {Error} 403 if the user is not authorised to view this resource.
 * @throws {Error} 404 if no postcodes are found.
 * @returns {undefined} Nothing, updates the context object with the postcodes from the database.
 *
 * @see {@link getAllPostcodes} - fetches all the postcodes from the database.
 *
 */
async function getAllPostcodes(request: FastifyRequest, reply: FastifyReply) {
    const { user } = cnx.state
    if (!cnx.state.user) {
        logger.error("[401] User needs to log in.")
        cnx.throw(401, "You are not logged in.")
        return
    }
    const ability = createAbilityFor(user)

    if (ability.can("readAll", "Postcode")) {
        const postcodes = await Postcode.find()
        cnx.status = 200
        cnx.body = postcodes
    } else {
        logger.error("[403] User is not authorised to view this resource.")
        cnx.throw(403, "You are not authorised to view this resource")
    }
}

/**
 * Returns a random postcode from the database. Only authenticated users can access this route.
 *
 * @async
 * @function getRandomPostcodeRoute
 *
 * @param {FastifyRequest} request - The Fastify request object containing the request information.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @throws {Error} 400 if the request is invalid.
 * @throws {Error} 401 if the user is not logged in.
 * @throws {Error} 403 if the user is not authorised to view this resource.
 * @returns {undefined} Nothing, updates the context's response body with the random postcode returned from getRandomPostcode.
 *
 * @see {@link getRandomPostcode} - fetches a random postcode using the postcode.io API.
 *
 */
async function getRandomPostcodeRoute(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { user } = cnx.state
    if (!cnx.state.user) {
        logger.error("[401] User needs to log in.")
        cnx.throw(401, "You are not logged in.")
        return
    }
    const ability = createAbilityFor(user)

    if (ability.can("read", "Postcode")) {
        const randompostcode = await getRandomPostcode()
        cnx.status = 200
        logger.info(`returned postcode ${randompostcode.postcode}`)
        cnx.body = randompostcode
    } else {
        logger.error("[403] User is not authorised to view this resource.")
        cnx.throw(403, "You are not authorised to view this resource")
    }
}

/**
 * Returns a postcode from the database. Only authenticated users can access this route.
 *
 * @async
 * @function getPostcodeRoute
 *
 * @param {FastifyRequest} request - The Fastify request object containing the request information.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @throws {Error} 400 if the postcode is not provided or is invalid.
 * @throws {Error} 401 if the user is not logged in.
 * @throws {Error} 403 if the user is not authorised to view this resource.
 * @throws {Error} 404 if the postcode is not found.
 * @returns {undefined} Nothing, updates the response body with the postcode returned from getPostcode.
 *
 * @see {@link getPostcode} - fetches a postcode using the postcode.io API, or a cached version from the database.
 * @see {@link validatePostcode} - validates the postcode using the postcode.io API.
 *
 */
async function getPostcodeRoute(request: FastifyRequest, reply: FastifyReply) {
    const { postcode } = request.params as PostcodeParams

    if (!postcode) {
        logger.error("No postcode provided.")
        reply
            .status(400)
            .send({
                error: "Bad Request",
                message: "Please provide a postcode.",
            })
        return
    }

    let { user } = cnx.state
    if (!user) {
        user = User({ role: await Role.findOne({ name: "none" }) })
    }
    const ability = createAbilityFor(user)

    if (ability.can("read", "Postcode")) {
        const validPostcode = await validatePostcode(postcode)

        if (validPostcode) {
            const body = await getPostcode(postcode)
            cnx.status = 200
            logger.info(`returned postcode ${body.postcode}`)
            cnx.body = body
        } else {
            logger.error("Invalid postcode provided.")
            cnx.throw(400, "Please provide a valid postcode.")
        }
    } else {
        logger.error("[403] User is not authorised to view this resource.")
        cnx.throw(403, "You are not authorised to view this resource")
    }
}

// === Helpers ===

/**
 * Finds a postcode given a pair of latitude and longitude values. Used in Searches.
 *
 * @async
 * @function findPostcodeFromWGS84
 *
 * @param {LocationPair} location - A pair of lat/long values to find a postcode for.
 *
 * @returns {(String|undefined)} A UK postcode or undefined if one has not been found.
 *
 * @see {@link searchArea } To see an implementation of this function
 *
 */
async function findPostcodeFromWGS84(location: LocationPair) {
    const postcodeapi = "https://api.postcodes.io/postcodes" // using bulk search as it works better for some reason, also more extensible
    const req = {
        geolocations: [
            {
                longitude: location.longitude,
                latitude: location.latitude,
                radius: 1000,
                limit: 1,
            },
        ],
    }
    const response = await axios.post(postcodeapi, req)
    const result = response.data.result[0]
    //logger.info(result);
    if (!result.result) {
        logger.info("No postcodes found, returning nothing")
        return
    }
    const queryResult = result.result[0]
    //logger.info(queryResult); // postcodes.io postcode object
    return queryResult.postcode
}

/**
 * Gets a random UK postcode from the postcodes.io API.
 * Postcodes are guaranteed to be valid as they are retreived from the API directly.
 *
 * @async
 * @function getRandomPostcode
 *
 * @returns {*} An object containing the details of the postcode.
 *
 * @see https://postcodes.io/docs for documentation of the returned object.
 * @see getPostcode
 * @see getRandomPostcodeRoute
 */
async function getRandomPostcode() {
    try {
        const response = await axios.get(
            "https://api.postcodes.io/random/postcodes"
        )

        // EXTREMELY unlikely but added nonetheless.
        const postcodeExists = await Postcode.exists({
            postcode: response.data.result.postcode,
        })

        if (postcodeExists) {
            logger.info(
                `Postcode already exists in db: ${response.data.result.postcode}`
            )
            return postcodeExists
        }

        await processPostcode(response.data.result)
        return response.data.result
    } catch (error) {
        logger.error(error)
    }
}

/**
 * Gets a UK postcode from the postcodes.io API.
 * If the postcode is already in the database, it will return the existing Postcode document instead.
 *
 * @async
 * @function getPostcode
 *
 * @param {String} validPostcodeString - A valid UK postcode.
 * @returns {*} An object containing the details of the postcode.
 *
 * @see https://postcodes.io/docs for documentation of the returned object.
 * @see getRandomPostcode
 * @see validatePostcode
 */
async function getPostcode(validPostcodeString: string) {
    // check if postcode exists in db
    const postcodeExists = await Postcode.findOne({
        postcode: validPostcodeString,
    })

    if (postcodeExists) {
        logger.info(`Postcode already exists in db: ${validPostcodeString}`)
        return postcodeExists
    }

    try {
        const response = await axios.get(
            `https://api.postcodes.io/postcodes/${validPostcodeString}`
        )
        await processPostcode(response.data.result)
        return response.data.result
    } catch (error) {
        logger.error(error)
    }
}

/**
 * Validates a UK postcode using the postcodes.io validation API.
 *
 * @async
 * @function validatePostcode
 *
 * @param {String} postcodeString
 * @returns A boolean value indicating whether the postcode is valid or not.
 *
 * @see getPostcode
 */
async function validatePostcode(postcodeString: string) {
    try {
        const response = await axios.get(
            `https://api.postcodes.io/postcodes/
      ${postcodeString}
      /validate`
        )

        logger.info(`${postcodeString} is valid: ${response.data.result}`)

        if (response.data.result === true) {
            return true
        } else {
            return false
        }
    } catch (error) {
        logger.error(error)
    }
}

/**
 * Processes a postcode object from the postcodes.io API and saves it to the database as a Postcode model.
 *
 * @async
 * @function processPostcode
 *
 * @param {Object} postcodeObject - A mongoose object containing the details of a postcode.
 * @returns {undefined} Nothing, the postcode is just saved to the database.
 *
 * @see getPostcode
 */
async function processPostcode(postcodeObject: PostcodeDoc) {
    logger.info(`Processing: ${postcodeObject.postcode}`)

    // fields to save: postcode, eastings, northings, country, longitude, latitude, region (can be null)
    // parliamentary_constituency, admin_district, admin_ward, parish, admin_county (can be null too)

    const {
        postcode,
        eastings,
        northings,
        country,
        longitude,
        latitude,
        region,
        parliamentary_constituency,
        admin_district,
        admin_ward,
        parish,
        admin_county,
    } = postcodeObject

    const newPostcode = new Postcode({
        postcode: postcode,
        eastings: eastings,
        northings: northings,
        country: country,
        longitude: longitude,
        latitude: latitude,
        region: region,
        parliamentary_constituency: parliamentary_constituency,
        admin_district: admin_district,
        admin_ward: admin_ward,
        parish: parish,
        admin_county: admin_county,
    })

    try {
        await newPostcode.save()
        logger.info(`Successfully saved postcode: ${postcodeObject.postcode}`)
    } catch (error) {
        logger.error(error)
    }
}

export { getAllPostcodes, getRandomPostcodeRoute, getPostcodeRoute }
