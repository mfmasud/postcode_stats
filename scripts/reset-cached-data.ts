/**
 * @file Script to reset cached location and search data
 * @description Resets cached data collections in the database. This is a destructive
 * operation that should be run manually when you need to clear cached query results
 * and location data.
 *
 * WARNING: This script is destructive. It will delete all documents from the following
 * collections:
 * - Postcode (cached postcode lookup results)
 * - Search (cached search queries)
 * - Crime (cached crime data)
 * - CrimeList (cached crime list data)
 * - Related Counter documents for crimeList and search
 *
 * Note: This does NOT delete Atco, BusStop, or Nptg collections to avoid forcing
 * a time-consuming re-download of reference data.
 *
 * @see {@link module:helpers/database~resetDataDB} for the reset logic
 */

import dotenv from "dotenv"
dotenv.config()

import logger from "../src/utils/logger.js"
import { connectDB, disconnectDB, resetDataDB } from "../src/helpers/database.js"

async function resetCachedData() {
    try {
        logger.info("Starting cached data reset process...")

        await connectDB(true)
        await resetDataDB()

        logger.info("Cached data has been reset successfully!")
    } catch (error) {
        logger.error(
            `Error during cache reset: ${error instanceof Error ? error.message : "Unknown error"}`
        )
        process.exit(1)
    } finally {
        await disconnectDB(true)
    }
}

resetCachedData()
