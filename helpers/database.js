const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
//mongoose.set("debug", true);

const User = require("../models/User");
const Role = require("../models/Role");

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

// Initialise + reset dummy db
async function initDB() {

  console.log("Resetting database...");

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
    })

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

    console.log("Reset database successfully!");

  } catch (error) {
    console.error(`Error resetting database:\n\n${error.message}`);
  }
}

module.exports = { connectDB, disconnectDB, initDB };
