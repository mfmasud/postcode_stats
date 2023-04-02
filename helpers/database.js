const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
//mongoose.set("debug", true);

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

// Connect MongoDB database
async function connectDB(output = false) {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        if (output) {
            console.log("Connected to database!");
        }
    } catch (error) {
        console.error(`Error connecting to database:\n\n${error.message}`);
    }
}

// Disconnect MongoDB database
async function disconnectDB(output = false) {
    try {
        await mongoose.connection.close();

        if (output) {
            console.log("Disconnected from database!");
        }
    } catch (error) {
        console.error(`Error disconnecting from database:\n\n${error.message}`);
    }
}

// Initialise + reset dummy user db
async function initUserDB() {
    console.log("Resetting User data...");

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
            role: UserRole,
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

        console.log("Reset user data successfully!");
    } catch (error) {
        console.error(`Error resetting user data:\n\n${error.message}`);
    }
}

// Reset location data cache
async function resetDataDB() {
    console.log("Resetting location data...");

    try {
        // Delete all documents in each collection
        //await Atco.deleteMany();
        //await BusStop.deleteMany();
        await Postcode.deleteMany();
        // await Nptg.deleteMany();
        await Search.deleteMany();
        await Crime.deleteMany();
        await CrimeList.deleteMany();

        console.log("Reset location data successfully!");
    } catch (error) {
        console.error(`Error resetting location data:\n\n${error.message}`);
    }
}

async function initLocationDB() {
    // 1 time download of NPTG locality database ~ 5mb csv. Is cached.
    // Takes approximately 10 minutes (*on Codio) to save everything so this should be run on setup only.
    await getNptgData();

    // Get and process ATCO codes master list
    await saveAtcoList();

    await getScotlandLocations(); // adds alternative names to scottish location names
    // await getEnglandLocations();
    // await getWalesLocations();

    console.log("Successfully initialised Location Data");
}

module.exports = {
    connectDB,
    disconnectDB,
    initUserDB,
    resetDataDB,
    initLocationDB,
};
