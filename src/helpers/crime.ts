/**
 * @file Contains the functions to retrieve and process crime data from the Police API.
 * @module helpers/crime
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires utils/logger
 * @requires axios
 * @requires models/CrimeList
 * @requires models/Crime
 *
 * @exports getCrimeData
 *
 */

// https://data.police.uk/docs/method/crime-street/ - Uk crime data by street
// can search by lat and long and relate it to a search object.

import logger from "../utils/logger.js"
import axios from "axios"

import CrimeList, { type CrimeListDoc } from "../models/CrimeList.js"
import Crime from "../models/Crime.js"
import type { CrimeAPIResponse } from "../types/crime.js"

/**
 * Queries the Police API for crime data using a pair of latitude and longitude values.
 * The data is then processed into a CrimeList using processCrimeData.
 *
 * @async
 * @function getCrimeData
 *
 * @param {Number} lat - The latitude to pass to the Police API
 * @param {Number} long - The longitude to pass to the Police API
 * @returns {*} - Returns nothing
 *
 * @see processCrimeData
 *
 */
async function getCrimeData(lat: number, long: number) {
    // Api note from the provider: crimes appear lower for Scotland. Should be noted to end users.
    // also, unless the data param is added, it returns the crimes in the most recent month by default
    // 15-30 requests per second.
    // lat/long can be made to be less precise, or mapped to an area with a poly, to cache more crimes in the same area.
    const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${long}`
    const response = await axios.get(url)
    const existingCrimeList = (await CrimeList.exists({
        latitude: lat,
    })) as CrimeListDoc
    if (existingCrimeList) {
        logger.info(
            `Existing crime list found, ID: ${existingCrimeList.crimeListID}`
        )
        return
    } else {
        await processCrimeData(lat, long, response.data)
    }

    return
}

/**
 * Processes the crime data retrieved from the Police API into a CrimeList and Crime models.
 *
 * @async
 * @function processCrimeData
 *
 * @param {Number} lat - The latitude to pass to the Police API
 * @param {Number} long - The longitude to pass to the Police API
 * @param {*} rawCrimeData - The raw crime data to be processed, retrieved from getCrimeData
 * @returns {*} - Returns nothing
 *
 * @see getCrimeData
 *
 */
async function processCrimeData(
    lat: number,
    long: number,
    rawCrimeData: CrimeAPIResponse
) {
    logger.info("Processing new crime list")
    // model the Crime and categorise it too for paid / admin accounts.
    // lat long to differentiate crime lists

    // logger.info(rawCrimeData); // can be empty
    if (rawCrimeData.length === 0) {
        logger.info("No crime data.")
        CrimeList.create({
            crimeListID: 1,
            latitude: lat,
            longitude: long,
            count: 0,
            date: "X",
            emptydata: true,
        })
        // emptydata and the X here is used to indicate that there is no data.
        return
    }

    const crimedate = rawCrimeData[0]?.month ?? ""

    const newCrimeList = new CrimeList({
        crimeListID: 1,
        latitude: lat,
        longitude: long,
        count: rawCrimeData.length,
        date: crimedate,
    })

    // Only store 5 (or less) crimes to speed up operations. 5 is used by the search model.
    // City Of London for example has 2309 crimes in the area.
    // In the future, this can be moved to an external thingy
    rawCrimeData = rawCrimeData.slice(0, 5)

    const newCrimes = []
    const ids = []
    for (const data of rawCrimeData) {
        const existingCrime = await Crime.exists({ crimeID: data.id })
        if (existingCrime) {
            continue
        }

        const newCrime = new Crime({
            crimeID: data.id,
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            crime_category: data.category,
            crime_date: data.month,
        })

        if (data.outcome_status) {
            newCrime.outcome_category = data.outcome_status.category
            newCrime.outcome_date = data.outcome_status.date
        }

        ids.push(newCrime._id)
        newCrimes.push(newCrime)

        //logger.info(newCrime);
    }

    //logger.info(newCrimes);

    if (newCrimes.length > 0) {
        await Crime.insertMany(newCrimes)

        try {
            newCrimeList.crimes = ids
            await newCrimeList.save()

            //logger.info(newCrimeList);
        } catch (error) {
            logger.error(error)
        }
    }

    logger.info("Finished processing new crime list")
}

export { getCrimeData, processCrimeData }
