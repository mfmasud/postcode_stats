/**
 * @file Script to initialize location data in the database
 * @description Initializes location database collections with NPTG locality data,
 * ATCO codes, and alternative location names for UK regions. This is a one-time
 * setup operation that should be run manually when setting up the database.
 *
 * The script initializes multiple location data sources:
 * - NPTG (National Public Transport Gazetteer) locality data (~43,876 records)
 * - ATCO (Association of Transport Coordinating Officers) codes
 * - Alternative names for Scotland locations
 * - Future: England and Wales location alternative names
 *
 * @see {@link module:helpers/database~initLocationDB} for the main helper function
 */

import dotenv from "dotenv"
dotenv.config()

import logger from "../src/utils/logger.js"
import { connectDB, disconnectDB, initLocationDB } from "../src/helpers/database.js"

async function initLocationData() {
    try {
        logger.info("Starting location data initialisation process...")

        await connectDB(true)
        await initLocationDB()

        logger.info("Location data initialised successfully!")
    } catch (error) {
        logger.error(
            `Error during location data initialisation: ${error instanceof Error ? error.message : "Unknown error"}`
        )
        process.exit(1)
    } finally {
        await disconnectDB(true)
    }
}

initLocationData()
