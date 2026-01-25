/**
 * @file Script to seed user data for initial database setup
 * @description Seeds the database with initial user data including roles and test users.
 * This is a one-time setup operation that should be run manually when setting up the database.
 *
 * WARNING: This script is destructive. It will delete all existing User, Role, and related
 * Counter documents before creating new data.
 *
 * Creates:
 * - 4 roles: admin, paiduser, user, none
 * - 3 users: TestUser1 (user), PaidUser1 (paiduser), TestAdmin1 (admin)
 *
 * @see {@link module:helpers/database~initUserDB} for the seeding logic
 */

import dotenv from "dotenv"
dotenv.config()

import logger from "../src/utils/logger.js"
import { connectDB, disconnectDB, initUserDB } from "../src/helpers/database.js"

async function seedUserData() {
    try {
        logger.info("Starting user data seeding process...")

        await connectDB(true)
        await initUserDB()

        logger.info("User data seeded successfully!")
    } catch (error) {
        logger.error(
            `Error during user data seeding: ${error instanceof Error ? error.message : "Unknown error"}`
        )
        process.exit(1)
    } finally {
        await disconnectDB(true)
    }
}

seedUserData()
