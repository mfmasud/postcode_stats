/**
 * @file Contains the functions to link data related to a search to the Search model.
 * @module helpers/search
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires models/Atco
 * @requires models/CrimeList
 * @requires utils/logger
 * @requires helpers/AtcoCodes
 * @requires helpers/crime
 *
 * @exports getRelatedStops
 * @exports getRelatedCrimes
 * @exports linkAtco
 *
 * @see {@link module:routes/search} for the route which uses these functions.
 * @See {@link module:models/search} for more about the SearchModel parameter used throughout this file.
 *
 */

import type { FastifyRequest } from "fastify"
import logger from "../../utils/logger.js"

import { queryAtcoAPI } from "../../helpers/AtcoCodes.js"
import { getCrimeData } from "../../helpers/crime.js"

// models
import Atco from "../../models/Atco.js"
import CrimeList from "../../models/CrimeList.js"
import { type SearchDoc } from "../../models/Search.js"
import { type PostcodeDoc } from "../../models/Postcode.js"
import { type AtcoDoc } from "../../models/Atco.js"
import { type CrimeListDoc } from "../../models/CrimeList.js"

/**
 * Links a `CrimeList` to the `Search` model by comparing the latitude value used by both.
 * populates the Search model's linkedCrimeList field with the returned `CrimeList` model.
 *
 * @async
 * @function linkCrimeList
 *
 * @param {mongoose.Object} SearchModel - The `Search` model to link the `CrimeList` details to.
 * @returns nothing - this function only links the `CrimeList` to the `Search` model.
 *
 * @throws {Error} If no matching `CrimeList` is returned from the database.
 *
 * @see {@link linkAtco} - links associated busstops to the `Search` model
 * @see {@link getRelatedCrimes} - Adds the `Crime`s to the `Search` model.
 */
async function linkCrimeList(SearchModel: SearchDoc) {
    // links crime list to search model
    // can be linked by latitude - assuming it is available. If not, this should have been calculated beforehand.

    const linkedCrimes = await CrimeList.findOne<CrimeListDoc>({
        latitude: SearchModel.latitude,
    })
    if (!linkedCrimes) {
        logger.error("Could not link crime list to search.")
        return
    }
    SearchModel.linkedCrimeList = linkedCrimes._id
    logger.info("Successfully linked crime list to search")
    await SearchModel.save()
    return
}

/**
 * Adds related crime data to the `Search` model. Requires the `Search` model to have a linked `CrimeList` already.
 * Populates the `Search` model's `queryCrimes` field with the `Crime`s from the `CrimeList.crimes` array.
 *
 * @async
 * @function getRelatedCrimes
 *
 * @param {mongoose.Object} SearchModel - The `Search` model to add the `CrimeList` details to.
 * @returns nothing, adds the `CrimeList` to the `Search` model.
 *
 * @see {@link getCrimeData} - fetches the crime data from the Police API, stores it as a `CrimeList` model.
 * @see {@link linkCrimeList} - links the `CrimeList` to the `Search` model for use in this function.
 */
async function getRelatedCrimes(SearchModel: SearchDoc) {
    await SearchModel.populate<{ Postcode: PostcodeDoc }>("Postcode")
    const { latitude, longitude } = SearchModel

    const postcodeDoc = SearchModel.Postcode as PostcodeDoc | null
    if (postcodeDoc && postcodeDoc.country === "Northern Ireland") {
        // NI not handled by policing API.
        logger.info("Cannot link NI CrimeList.")
        return
    }

    if (latitude && longitude) {
        await getCrimeData(latitude, longitude) // fetches the Police API
        await linkCrimeList(SearchModel) // Links the CrimeList data to the Search model
        if (SearchModel.linkedCrimeList) {
            // Populate the linked CrimeList to access crimes
            const populatedSearch = await SearchModel.populate<{
                linkedCrimeList: CrimeListDoc
            }>("linkedCrimeList")
            const crimeListDoc = populatedSearch.linkedCrimeList
            if (crimeListDoc) {
                logger.info("Added crimes to search")
                SearchModel.queryCrimes = crimeListDoc.crimes // copy over list of Crime ObjectIds from the crimelist
            } else {
                SearchModel.queryCrimes = [] // empty to indicate not found
            }
        } else {
            SearchModel.queryCrimes = [] // empty to indicate not found
        }
    } else {
        logger.error("Need LAT/LONG Coordinates to use the Police API.")
        SearchModel.queryCrimes = [] // empty to indicate not found
    }

    await SearchModel.save()
    return
}

/**
 * Adds property data to the `Search` model.
 * Currently unimplemented, as the Zoopla API is discontinued.
 * The Urban Big Data Centre has a similar API which needs to be implemented.
 *
 * @async
 * @function getRelatedListings
 *
 * @param {mongoose.Object} SearchModel - The `Search` model to add the property data to.
 * @returns nothing, adds the property data to the `Search` model's `queryListings` field.
 *
 * @see {@link https://www.ubdc.ac.uk/data-services/data-catalogue/housing-data/zoopla-property-data/|Zoopla Property Data} provided by University of Glasgow's Urban Big Data Centre.
 *
 */
async function getRelatedListings(SearchModel: SearchDoc) {
    const { latitude, longitude } = SearchModel
    //await getPropertyData(latitude, longitude);
    return
}

/**
 * Finds the related Atco model to link to a search.
 * Takes the Postcode model and finds the related Atco model by searching the county, district, region and country values.
 * This is necessary as region names are not consistent between the Postcode API and the Naptan API.
 * Take for example the region "City Of London". The Postcode API returns this as the admin_district, but in the Naptan API returns this under "Greater London".
 *
 * @async
 * @function searchAtco
 *
 * @param {mongoose.Object} PostcodeModel - The Postcode model object
 * @returns {mongoose.Object} The Atco model object to link to the Search
 *
 * @todo Refactor this function to be more readable - A switch/case combined with a function to search for the Atco model would be better.
 *
 * @see {@link linkAtco} - links associated busstops to the `Search` model
 * @see {@link getEnglandLocations} - Generates the `Atco` model's `other_names` field for England.
 * @see {@link getScotlandLocations} - Generates the `Atco` model's `other_names` field for Scotland.
 * @see {@link getWalesLocations} - Generates the `Atco` model's `other_names` field for Wales.
 */
async function searchAtco(PostcodeModel: PostcodeDoc) {
    const {
        admin_county,
        admin_district,
        parliamentary_constituency,
        region,
        country,
    } = PostcodeModel
    //logger.info(admin_county, admin_district, region);

    if (country === "Scotland") {
        const region = "Scotland"
    }

    const pc = parliamentary_constituency
    let AtcoToLink

    // starting to look ugly - maybe use functions or switch/case
    if (!admin_county) {
        logger.info("No admin county")

        if (!admin_district) {
            // no admin district
            logger.info("No admin district")
        } else {
            // admin district exists
            AtcoToLink = await Atco.findOne({ location: admin_district })
            if (!AtcoToLink) {
                AtcoToLink = await Atco.findOne({
                    other_names: admin_district,
                })
            }

            if (region === "London") {
                /*
                example: Lambeth - Local Authority / London Borough

                Postcode API data:
                Region: London
                admin_district: Lambeth

                In the ATCO List, this is part of "Greater London".
                In the future, this will be considered an altname for "London", generated from getEnglandLocations

                This also includes postcodes in the City of London (e.g. E1 7DA)
                */
                AtcoToLink = await Atco.findOne({
                    location: "Greater London",
                })
            }

            if (!AtcoToLink && pc) {
                // parlimentiary constituency, e.g. Poole (South West)
                // Others like Bournemout East would be under Dorset (ceremonial country)
                AtcoToLink = await Atco.findOne({ location: pc })
                if (!AtcoToLink) {
                    AtcoToLink = await Atco.findOne({ other_names: pc })
                }
            }
        }
    } else {
        // admin county exists
        AtcoToLink = await Atco.findOne({ location: admin_county })
        if (!AtcoToLink) {
            AtcoToLink = await Atco.findOne({ other_names: admin_county })
        }
    }

    if (AtcoToLink) {
        // match found
        logger.info(
            `Found matching ATCO: code ${AtcoToLink.code} matches ${AtcoToLink.location}, ${AtcoToLink.region}`
        )
        await queryAtcoAPI(AtcoToLink.code)
        return AtcoToLink
    } else {
        logger.info("Matching ATCO not found")
        return
    }
}

/**
 * Links the `Atco` model to the `Search` model.
 * Currently called in the search route itself, instead of getRelatedStops, unlike linkCrimeList.
 *
 * @async
 * @function linkAtco
 *
 * @param {mongoose.Object} SearchModel - The `Search` model to link the `Atco` model to.
 * @returns nothing, adds the `Atco` model to the `Search` model's `linkedATCO` field.
 *
 * @see {@link linkCrimeList} - links associated crimes to the `Search` model using the `CrimeList` model.
 * @see {@link searchAtco} - Finds the correct `Atco` model to be linked.
 *
 */
async function linkAtco(SearchModel: SearchDoc) {
    // links Search model to correct ATCO from available information.
    // Should be run when search is created / postcode is updated.
    // Does not return anything
    //logger.info("Looking to link Atco");

    await SearchModel.populate<{ Postcode: PostcodeDoc }>("Postcode")
    const postcodeDoc = SearchModel.Postcode as PostcodeDoc | null
    let linkedAtco

    if (postcodeDoc && postcodeDoc.country === "Northern Ireland") {
        // Skip ATCO linking for northern irish postcodes e.g. BT23 6SA
        // linkedAtco = linkOther(SearchModel.Postcode)
        logger.info("Cannot link NI Atco.")
        return
    } else if (postcodeDoc) {
        linkedAtco = await searchAtco(postcodeDoc)
    }

    if (!linkedAtco) {
        return
    }

    SearchModel.linkedATCO = linkedAtco._id
    await SearchModel.save()
}

/**
 * Finds the related bus stops to a `Search` model.
 * This is done by first finding and linking the associated `Atco` model using `linkAtco`.
 * After this, the distance is calculated from `Atco.busstops` - the closest 5 `BusStop`s to the `Search` model's `latitute` and `longitude` fields.
 * For now, only the first 5 `BusStop`s are returned as nothing is being calculated.
 *
 * @async
 * @function getRelatedStops
 *
 * @param {mongoose.Object} SearchModel - The `Search` model to find the related bus stops for.
 * @param {number} radius - The radius in metres to search for bus stops in. Defaults to 1000m.
 * @returns nothing, adds the `BusStop` models to the `Search` model's `relatedStops` field.
 *
 * @see {@link linkAtco} - Links the `Atco` model to the `Search` model.
 */
async function getRelatedStops(SearchModel: SearchDoc, radius: number = 1000) {
    // bus stops around a 1km radius from a given point. maximum returned should be 4 points (arbitrary numbers)
    const { longitude, latitude, Northing, Easting } = SearchModel

    await SearchModel.populate<{ linkedATCO: AtcoDoc }>("linkedATCO")
    const linkedAtco = SearchModel.linkedATCO as AtcoDoc | null

    // for java : https://stackoverflow.com/questions/22063842/check-if-a-latitude-and-longitude-is-within-a-circle
    // first check if there are latitude/ longitude for the query bus stop then search within the radius from SearchModel.latitude / longitude
    // just returning first 5 for now...
    // Need to convert BNG to lat/long for empty values or search using BNG instead. See https://github.com/chrisveness/geodesy/blob/master/osgridref.js to convert

    if (linkedAtco && linkedAtco.busstops) {
        SearchModel.queryBusStops = linkedAtco.busstops.slice(0, 5)
    }

    await SearchModel.save()
}

/**
 * Updates the links for a `Search` model.
 * The links are added to the `_links` field of the `Search` model and are used for HAL/JSON:API compliant API responses.
 *
 * @async
 * @function updateLinks
 *
 * @param {FastifyRequest} request - The Fastify request object
 * @param {mongoose.Object} SearchModel - The `Search` model to add resource-describing links to.
 * @returns {undefined} Nothing, updates the Search model with the links.
 *
 * @see {@link https://en.wikipedia.org/wiki/HATEOAS} - HATEOAS compliant API responses.
 */
async function updateLinks(request: FastifyRequest, SearchModel: SearchDoc) {
    await SearchModel.populate<{ Postcode: PostcodeDoc }>("Postcode")
    const lat = SearchModel.latitude
    const long = SearchModel.longitude
    const postcodeDoc = SearchModel.Postcode as PostcodeDoc | null
    const hostname = request.host

    const postcode = postcodeDoc?.postcode

    SearchModel._links = {}

    // SearchModel._links.alternate = `${hostname}/api/v1/search/${searchModel.searchID}`;
    SearchModel._links.postcode = {
        href: `https://${hostname}/api/v1/postcodes/${postcode}`,
    }

    if (lat && long) {
        SearchModel._links.self = {
            href: `https://${hostname}/api/v1/search/?latitude=${lat}&longitude=${long}`,
        }
    }

    try {
        //logger.info(JSON.stringify(SearchModel._links));
        await SearchModel.save()
    } catch (err) {
        logger.error(err)
    }
}

export { getRelatedStops, getRelatedCrimes, linkAtco, updateLinks }
