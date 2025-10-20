/**
 * @file Contains functions for connecting to and initialising database collections.
 * @module helpers/database
 * @author Mohammed Fardhin Masud <fardhinmasud@gmail.com>
 *
 * @requires dotenv
 * @requires mongoose
 * @requires utils/logger
 * @requires models/User
 * @requires models/Role
 * @requires models/Atco
 * @requires models/BusStop
 * @requires models/Postcode
 * @requires models/Nptg
 * @requires models/Search
 * @requires models/CrimeList
 * @requires models/Crime
 * @requires helpers/AtcoCodes
 * @requires helpers/locations
 *
 * @exports connectDB
 * @exports disconnectDB
 * @exports initUserDB
 * @exports initAtcoDB
 * @exports initPostcodeDB
 *
 */

import dotenv from "dotenv"
dotenv.config()

import mongoose from "mongoose"
mongoose.set("strictQuery", true)
//mongoose.set("debug", true);

import logger from "../utils/logger.js"

import User from "../models/User.js"
import Role from "../models/Role.js"
// import Atco from "../models/Atco.js";
// import BusStop from "../models/BusStop.js";
import Postcode from "../models/Postcode.js"
import Nptg from "../models/Nptg.js"
import Search from "../models/Search.js"
import CrimeList from "../models/CrimeList.js"
import Crime from "../models/Crime.js"
import Counter from "../models/Counter.js"

import { saveAtcoList } from "./AtcoCodes.js"

import {
    getScotlandLocations,
    /*getEnglandLocations, getWalesLocations,*/ getNptgData,
} from "./locations.js"

const MONGO_URI = process.env.DB_STRING // mongodb connection - in this case it is to mongodb atlas in the .env file

/**
 * Connect to the mongodb server. The connection string is stored in the MONGO_URI parameter.
 *
 * @async
 * @function connectDB
 *
 * @param {boolean} [output=false] - Control whether or not to output a message indicating a successful connection.
 *
 * @see disconnectDB
 *
 */
async function connectDB(output: boolean = false) {
    try {
        if (!MONGO_URI) {
            throw new Error(
                "Database connection string not found in environment variables"
            )
        }
        await mongoose.connect(MONGO_URI)

        if (output) {
            logger.info("Connected to database!")
        }
    } catch (error) {
        logger.error(
            `Error connecting to database:\n\n${error instanceof Error ? error.message : "Unknown error"}`
        )
    }
}

/**
 * Disconnects from the mongodb database
 *
 * @async
 * @function disconnectDB
 *
 * @param {boolean} [output=false] - Control whether or not to output a message to the console stating that the database has been disconnected from.
 *
 * @see connectDB
 *
 */
async function disconnectDB(output: boolean = false) {
    try {
        await mongoose.connection.close()

        if (output) {
            logger.info("Disconnected from database!")
        }
    } catch (error) {
        logger.error(
            `Error disconnecting from database:\n\n${error instanceof Error ? error.message : "Unknown error"}`
        )
    }
}

/**
 * Initialises and resets the dummy Users and Roles collections. Requires an active mongodb connection.
 * Adds 4 users, corresponding to the anonymous, standard, paid and admin access levels.
 *
 * @async
 * @function initUserDB
 *
 * @see connectDB
 *
 */
async function initUserDB() {
    logger.info("Resetting User data...")

    try {
        // Delete all documents in each collection
        await User.deleteMany()
        await Role.deleteMany()
        await Counter.deleteOne({ counterName: "user" })

        // Create roles
        const AdminRole = await Role.create({
            name: "admin",
        })

        const PaidUser = await Role.create({
            name: "paiduser",
        })

        const UserRole = await Role.create({
            name: "user",
        })

        await Role.create({
            name: "none",
        })

        // Create sample documents for each collection

        await User.create({
            firstName: "Test",
            lastName: "User",
            username: "TestUser1",
            about: "about section about me a standard user",
            password: "password",
            passwordSalt: "salt",
            email: "TestUser1@test.com",
            role: UserRole,
            id: 1,
        })

        await User.create({
            firstName: "Paid",
            lastName: "User",
            username: "PaidUser1",
            about: "about section about me I have paid to get more access",
            password: "password",
            passwordSalt: "salt",
            email: "PaidUser1@test.com",
            role: PaidUser,
        })

        await User.create({
            firstName: "Test",
            lastName: "Admin",
            username: "TestAdmin1",
            about: "about section about me the admin",
            password: "password",
            passwordSalt: "salt",
            email: "TestAdmin1@test.com",
            role: AdminRole,
        })

        logger.info("Reset user data successfully!")
    } catch (error) {
        logger.error(
            `Error resetting user data:\n\n${error instanceof Error ? error.message : "Unknown error"}`
        )
    }
}

/**
 * Resets cached location data. Deletes the `Postcode`, `Search`, `Crime` and `CrimeList` collections.
 * Must be used carefully, as re-downloading data will take a long time.
 * As to not force a re-download, this function does not delete the `Atco`, `BusStop` and `Nptg` collections.
 *
 * @async
 * @function resetDataDB
 *
 * @see initLocationDB
 *
 */
async function resetDataDB() {
    logger.info("Resetting location data...")

    try {
        // Delete all documents in each collection
        //await Atco.deleteMany();
        //await BusStop.deleteMany();
        await Postcode.deleteMany()
        // await Nptg.deleteMany();
        await Search.deleteMany()
        await Crime.deleteMany()
        await CrimeList.deleteMany()
        await Counter.deleteOne({ counterName: "crimeList" })
        await Counter.deleteOne({ counterName: "search" })

        logger.info("Reset location data successfully!")
    } catch (error) {
        logger.error(
            `Error resetting location data:\n\n${error instanceof Error ? error.message : "Unknown error"}`
        )
    }
}

/**
 * Create the NPTG Collection with a unique index on NptgLocalityCode to prevent duplicates.
 *
 * @async
 * @function initNptg
 *
 * @see initLocationDB
 * @see getNptgData
 *
 */
async function initNptg() {
    try {
        await Nptg.collection.createIndex(
            { NptgLocalityCode: 1 },
            { unique: true }
        )
        logger.info("Initialised NPTG Collection successfully!")
    } catch (error) {
        logger.error(
            `Error initialising NPTG Collection: ${error instanceof Error ? error.message : "Unknown error"}`
        )
    }
}

/**
 * Initialises the location database collections. Adds the `Nptg` data if not cached already.
 * Assigns `Atco` codes for Scoltand,England and Wales and related names for Scotland.
 *
 * @async
 * @function initLocationDB
 *
 * @see resetDataDB
 *
 */
async function initLocationDB() {
    // Download and process NPTG data from NAPTAN
    await initNptg() // set up the NPTG collection on the database
    await getNptgData() // 1 time download of NPTG locality database ~ 5mb csv. Is cached after first run.

    // Get and process ATCO codes master list into the Atco collection
    await saveAtcoList()

    await getScotlandLocations() // adds alternative names to scottish location names
    // await getEnglandLocations();
    // await getWalesLocations();

    logger.info("Successfully initialised Location Data")
}

export {
    connectDB,
    disconnectDB,
    initUserDB,
    resetDataDB,
    initLocationDB,
    initNptg,
}
