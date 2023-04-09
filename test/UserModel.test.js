require("dotenv").config();

const mongoose = require("mongoose");
const { initUserDB, connectDB, disconnectDB } = require("../helpers/database");

const User = require("../models/User");
const Role = require("../models/Role");

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

var sinon = require("sinon");
const logger = require("../utils/logger");

chai.use(chaiAsPromised);
var expect = chai.expect;

describe("models/User.js", () => {
  let infoLogStub, errorLogStub;

  before(async () => {
    infoLogStub = sinon.stub(logger, "info");
    errorLogStub = sinon.stub(logger, "error"); // For duplicate key errors
    await connectDB();
  });

  beforeEach(async () => {
    await initUserDB();
  });

  after(async () => {
    await disconnectDB();
    logger.info.restore();
    logger.error.restore();
  });

  describe("Required fields", () => {
    it("should throw an error if a username is not provided", async () => {
      const user = new User({
        email: "test@test.com",
        password: "password",
        role: Role({ name: "user" }),
      });
      await expect(user.save()).to.be.rejectedWith(
        "User validation failed: username: Path `username` is required."
      );
    });

    it("should throw an error if an email is not provided", async () => {
      const user = new User({
        username: "TestUser2",
        password: "password",
        role: Role({ name: "user" }),
      });
      await expect(user.save()).to.be.rejectedWith(
        "User validation failed: email: Path `email` is required."
      );
    });

    it("should throw an error if a password is not provided", async () => {
      const user = new User({
        username: "TestUser2",
        email: "test@test.com",
        role: Role({ name: "user" }),
      });
      await expect(user.save()).to.be.rejectedWith(
        "User validation failed: password: Path `password` is required."
      );
    });

    it("should throw an error if a role is not provided", async () => {
      const user = new User({
        username: "TestUser2",
        email: "test@test.com",
        password: "password",
      });
      await expect(user.save()).to.be.rejectedWith(
        "User validation failed: role: Path `role` is required."
      );
    });
  });

  describe("Duplicate data", () => {
    it("should throw an error if the username already exists", async () => {
      const user = new User({
        username: "TestUser1",
        email: "test@test.com",
        password: "password",
        role: Role({ name: "user" }),
      });
      expect(user.save()).to.eventually.be.rejectedWith("E11000 duplicate key error collection: test.users index: username_1 dup key: { username: \"TestUser1\" }");
    });

    it("should throw an error if the email already exists", async () => {
      const user = new User({
        username: "testuser",
        email: "TestUser1@test.com",
        password: "password",
        role: Role({ name: "user" }),
      });
      expect(user.save()).to.eventually.be.rejectedWith("E11000 duplicate key error collection: test.users index: email_1 dup key: { email: \"TestUser1@test.com\" }");
    });
  });

  describe("Invalid data", () => {
    it("should ...", async () => {
      // do something
    });
  });

  describe("Auto Increment id", () => {
    // Always takes 80ms+ - needs to be optimised
    it("should auto-increment the ID field when creating a user", async () => {
      await User.create({
        username: "mocha",
        email: "mocha@coffee.co.uk",
        password: "chai",
        role: Role({ name: "none" }),
      });
      const newUser = await User.findOne({ username: "mocha" });
      expect(newUser.id).to.equal(4);
    });
  });
});
