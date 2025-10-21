/**
 * @file Contains functions for interacting with the postcodes.io API and processing and saving the data returned.
 * @module helpers/postcode
 * @author Mohammed Fardhin Masud <fardhinmasud@gmail.com>
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
import User, { type UserDocWithRole } from "../../models/User.js"
import Role from "../../models/Role.js"

import type { PostcodeParams } from "../../schemas/postcodeSchema.js"
import type {
    LocationPair,
    ExtAPIPostcodeResponse,
} from "../../types/postcode.js"

// === Utility Functions ===

/**
 * Performs preliminary normalisation of postcode input to improve database query matching.
 * This handles basic formatting issues like whitespace and case differences.
 * The postcodes.io API provides the definitive normalised format.
 *
 * @function normalisePostcodeInput
 *
 * @param {string} postcodeInput - The raw postcode string from user input
 * @returns {string} A preliminarily normalised postcode string (trimmed and uppercased)
 *
 * @example
 * normalisePostcodeInput("dg1 1aa ") // returns "DG1 1AA"
 * normalisePostcodeInput("  LU2 7EW") // returns "LU2 7EW"
 */
function normalisePostcodeInput(postcodeInput: string): string {
    return postcodeInput.trim().toUpperCase()
}

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
    if (!request.authUser) {
        logger.error("[401] User needs to log in.")
        reply
            .status(401)
            .send({ error: "Unauthorized", message: "You are not logged in." })
        return
    }

    const user = request.authUser
    const ability = createAbilityFor(user as UserDocWithRole)

    if (ability.can("readAll", "Postcode")) {
        const postcodes = await Postcode.find()
        reply.status(200).send([postcodes])
    } else {
        logger.error("[403] User is not authorised to view this resource.")
        reply.status(403).send({
            error: "Forbidden",
            message: "You are not authorised to view this resource",
        })
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
    if (!request.authUser) {
        logger.error("[401] User needs to log in.")
        reply
            .status(401)
            .send({ error: "Unauthorized", message: "You are not logged in." })
        return
    }

    const user = request.authUser
    const ability = createAbilityFor(user as UserDocWithRole)

    if (ability.can("read", "Postcode")) {
        const randompostcode = await getRandomPostcode()

        if (!randompostcode) {
            logger.error("Failed to retrieve random postcode")
            reply.status(500).send({
                error: "Internal Server Error",
                message: "Failed to retrieve random postcode",
            })
            return
        }

        reply.status(200).send(randompostcode)
        logger.info(`returned postcode ${randompostcode.postcode}`)
    } else {
        logger.error("[403] User is not authorised to view this resource.")
        reply.status(403).send({
            error: "Forbidden",
            message: "You are not authorised to view this resource",
        })
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
async function getPostcodeRoute(
    request: FastifyRequest<{ Params: PostcodeParams }>,
    reply: FastifyReply
) {
    const { postcode } = request.params

    if (!postcode) {
        logger.error("No postcode provided.")
        reply.status(400).send({
            error: "Bad Request",
            message: "Please provide a postcode.",
        })
        return
    }

    let user = request.authUser
    if (!user) {
        user = new User({
            role: await Role.findOne({ name: "none" }),
        }) as UserDocWithRole // creating a new user and looking up a role to make an anon user - probably not the best way
    }
    const ability = createAbilityFor(user as UserDocWithRole)

    if (ability.can("read", "Postcode")) {
        const validPostcode = await validatePostcode(postcode)

        if (validPostcode) {
            const API_Postcode = await getPostcode(postcode)

            if (!API_Postcode) {
                logger.error(`Failed to retrieve postcode: ${postcode}`)
                reply.status(404).send({
                    error: "Not Found",
                    message: "Postcode could not be retrieved",
                })
                return
            }

            reply.status(200).send(API_Postcode)
            logger.info(`returned postcode ${API_Postcode.postcode}`)
        } else {
            logger.error("Invalid postcode provided.")
            reply.status(400).send({
                error: "Bad Request",
                message: "Please provide a valid postcode.",
            })
        }
    } else {
        logger.error("[403] User is not authorised to view this resource.")
        reply.status(403).send({
            error: "Forbidden",
            message: "You are not authorised to view this resource",
        })
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
 * Gets a random UK postcode from the postcodes.io API and saves it to the database.
 * Postcodes are guaranteed to be valid as they are retreived from the API directly.
 *
 * @async
 * @function getRandomPostcode
 *
 * @returns {Promise<PostcodeDoc | null | undefined>} A MongoDB document containing the postcode details, or null/undefined if not found or an error occurred.
 *
 * @see https://postcodes.io/docs for documentation of the API response.
 * @see getPostcode
 * @see getRandomPostcodeRoute
 */
async function getRandomPostcode(): Promise<PostcodeDoc | null | undefined> {
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
            return await Postcode.findOne({
                postcode: response.data.result.postcode,
            })
        }

        await processPostcode(response.data.result)
        return await Postcode.findOne({
            postcode: response.data.result.postcode,
        })
    } catch (error) {
        logger.error(error)
    }
}

/**
 * Gets a UK postcode from the postcodes.io API and saves it to the database.
 * If the postcode is already in the database, it will return the existing Postcode document instead.
 *
 * @async
 * @function getPostcode
 *
 * @param {String} validPostcodeString - A valid UK postcode.
 * @returns {Promise<PostcodeDoc | null | undefined>} A MongoDB document containing the postcode details, or null/undefined if not found or an error occurred.
 *
 * @see https://postcodes.io/docs for documentation of the API response.
 * @see getRandomPostcode
 * @see validatePostcode
 */
async function getPostcode(
    validPostcodeString: string
): Promise<PostcodeDoc | null | undefined> {
    // Normalise input to improve database query matching (handles whitespace/case variations)
    const normalisedInput = normalisePostcodeInput(validPostcodeString)

    // check if postcode exists in db using normalised input
    const postcodeExists = await Postcode.exists({
        postcode: normalisedInput,
    })

    if (postcodeExists) {
        logger.info(`Postcode already exists in db: ${normalisedInput}`)
        return await Postcode.findOne({ postcode: normalisedInput })
    }

    try {
        const response = await axios.get(
            `https://api.postcodes.io/postcodes/${normalisedInput}`
        )

        // Process and save the postcode
        await processPostcode(response.data.result)

        // Query using the API's normalised postcode (definitive format from postcodes.io)
        return await Postcode.findOne({
            postcode: response.data.result.postcode,
        })
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
    // Normalise input before validation
    const normalisedInput = normalisePostcodeInput(postcodeString)

    try {
        const response = await axios.get(
            `https://api.postcodes.io/postcodes/${normalisedInput}/validate`
        )

        logger.info(`${normalisedInput} is valid: ${response.data.result}`)

        if (response.data.result === true) {
            return true
        } else {
            return false
        }
    } catch (error) {
        logger.error(error)
        return false
    }
}

/**
 * Processes a postcode object from the postcodes.io API and saves it to the database as a Postcode model.
 *
 * @async
 * @function processPostcode
 *
 * @param {ExtAPIPostcodeResponse} postcodeObject - The details of a postcode fetched from hte postcodes.io API.
 * @returns {Promise<PostcodeDoc>} A Postcode document, after it has been saved.
 *
 * @see getPostcode
 */
async function processPostcode(
    postcodeObject: ExtAPIPostcodeResponse
): Promise<PostcodeDoc | null | undefined> {
    logger.info(`Processing: ${postcodeObject.postcode}`)

    // Check if postcode already exists to avoid unnecessary processing
    const existingPostcode = await Postcode.exists({
        postcode: postcodeObject.postcode,
    })
    if (existingPostcode) {
        logger.info(
            `Postcode ${postcodeObject.postcode} already exists in database, returning existing postcode`
        )
        return await Postcode.findOne({ postcode: postcodeObject.postcode })
    }

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

    // Only save if we have the required coordinates - some postcodes don't -> IM3 1HL (Isle of Man)
    // Ideally the coordinates could be found out another way e.g. another API
    if (longitude == null || latitude == null) {
        logger.warn(
            `Skipping postcode ${postcode} - missing coordinates (longitude: ${longitude}, latitude: ${latitude})`
        )
        return
    }

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
        return newPostcode
    } catch (error) {
        logger.error(`Failed to save postcode ${postcode}:`, error)
        return
    }
}

export {
    getAllPostcodes,
    getRandomPostcodeRoute,
    getPostcodeRoute,
    findPostcodeFromWGS84,
    getPostcode,
    getRandomPostcode,
    validatePostcode,
    processPostcode,
}
