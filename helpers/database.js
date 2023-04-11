const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
//mongoose.set("debug", true);

const logger = require("../utils/logger");

const User = require("../models/User");
const Role = require("../models/Role");
const Atco = require("../models/Atco");
const BusStop = require("../models/BusStop");
const Postcode = require("../models/Postcode");
const Nptg = require("../models/Nptg");
const Search = require("../models/Search");
const CrimeList = require("../models/CrimeList");
const Crime = require("../models/Crime");

const { saveAtcoList } = require("../helpers/AtcoCodes");

const {
  getScotlandLocations,
  getEnglandLocations,
  getWalesLocations,
  getNptgData,
} = require("../helpers/locations");

const MONGO_URI = process.env.DB_STRING; // mongodb connection - in this case it is to mongodb atlas in the .env file

/**
 * Connect to the mongodb server. The connection string is stored in the MONGO_URI parameter.
 * @param {boolean} [output=false] - Control whether or not to output a message indicating a successful connection.
 * 
 * @async
 * @function connectDB
 * 
 * @see disconnectDB
 * 
 */
async function connectDB(output = false) {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (output) {
      logger.info("Connected to database!");
    }
  } catch (error) {
    logger.error(`Error connecting to database:\n\n${error.message}`);
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
async function disconnectDB(output = false) {
  try {
    await mongoose.connection.close();

    if (output) {
      logger.info("Disconnected from database!");
    }
  } catch (error) {
    logger.error(`Error disconnecting from database:\n\n${error.message}`);
  }
}

/**
 * Initialises and resets the dummy Users and Roles collections. Requires an active mongodb connection. 
 * Adds 3 users, corresponding to the standard, paid and admin access levels.
 * 
 * @async
 * @function initUserDB
 * 
 * @see connectDB
 * 
 */
async function initUserDB() {
  logger.info("Resetting User data...");

  try {
    // Delete all documents in each collection
    await User.deleteMany();
    await Role.deleteMany();

    // Create roles
    const AdminRole = await Role.create({
      name: "admin",
    });

    const PaidUser = await Role.create({
      name: "paiduser",
    });

    const UserRole = await Role.create({
      name: "user",
    });

    // Create sample documents for each collection

    const user = await User.create({
      firstName: "Test",
      lastName: "User",
      username: "TestUser1",
      about: "about section about me a standard user",
      password: "password",
      passwordSalt: "salt",
      email: "TestUser1@test.com",
      role: UserRole,
      id: 1,
    });

    const paiduser = await User.create({
      firstName: "Paid",
      lastName: "User",
      username: "PaidUser1",
      about: "about section about me I have paid to get more access",
      password: "password",
      passwordSalt: "salt",
      email: "PaidUser1@test.com",
      role: PaidUser,
    });

    const admin = await User.create({
      firstName: "Test",
      lastName: "Admin",
      username: "TestAdmin1",
      about: "about section about me the admin",
      password: "password",
      passwordSalt: "salt",
      email: "TestAdmin1@test.com",
      role: AdminRole,
    });

    logger.info("Reset user data successfully!");
  } catch (error) {
    logger.error(`Error resetting user data:\n\n${error.message}`);
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
  logger.info("Resetting location data...");

  try {
    // Delete all documents in each collection
    //await Atco.deleteMany();
    //await BusStop.deleteMany();
    await Postcode.deleteMany();
    // await Nptg.deleteMany();
    await Search.deleteMany();
    await Crime.deleteMany();
    await CrimeList.deleteMany();

    logger.info("Reset location data successfully!");
  } catch (error) {
    logger.error(`Error resetting location data:\n\n${error.message}`);
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
  // 1 time download of NPTG locality database ~ 5mb csv. Is cached.
  // Takes approximately 10 minutes (*on Codio) to save everything so this should be run on setup only.
  // Needs to be optimised like the Atco saving code, using insertmany/bulkwrite.
  await getNptgData();

  // Get and process ATCO codes master list
  await saveAtcoList();

  await getScotlandLocations(); // adds alternative names to scottish location names
  // await getEnglandLocations();
  // await getWalesLocations();

  logger.info("Successfully initialised Location Data");
}

module.exports = {
  connectDB,
  disconnectDB,
  initUserDB,
  resetDataDB,
  initLocationDB,
};
