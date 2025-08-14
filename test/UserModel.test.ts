require("dotenv").config();

import mongoose from "mongoose";
import { initUserDB, connectDB, disconnectDB } from "../helpers/database.js";

import User from "../models/User.js";
import Role from "../models/Role.js";

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi, afterEach } from "vitest";

// todo stub logger and roles

describe("models/User.js", () => {
  //let infoLogStub, errorLogStub;

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    //infoLogStub = sinon.stub(logger, "info");
    //errorLogStub = sinon.stub(logger, "error"); // For duplicate key errors
    await initUserDB();
  });

  afterEach(async () => {
    //sinon.restore();
  });

  afterAll(async () => {
    await disconnectDB();
    //sinon.restore();
  });

  describe("Auto Increment id", () => {
    // Always takes 80ms+ - needs to be optimised
    it("should auto-increment the ID field when creating a user", async () => {
      await User.create({
        username: "veet",
        email: "veet@test.co.uk",
        password: "test",
        role: new Role({ name: "none" }),
      });
      const newUser = await User.findOne({ username: "veet" });
      expect(newUser?.id).to.equal(4);
    });
  });

  describe("Required fields", () => {
    it("should throw an error if a username is not provided", async () => {
      const role = await Role.findOne({ name: "user" }).orFail();
      const user = new User({
        email: "test@test.com",
        password: "password",
        role: role._id,
      });
      await expect(user.validate()).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it("should throw an error if an email is not provided", async () => {
      const role = await Role.findOne({ name: "user" }).orFail();
      const user = new User({
        username: "TestUser2",
        password: "password",
        role: role._id,
      });
      await expect(user.validate()).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it("should throw an error if a password is not provided", async () => {
      const role = await Role.findOne({ name: "user" }).orFail();
      const user = new User({
        username: "TestUser2",
        email: "test@test.com",
        role: role._id,
      });
      await expect(user.validate()).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it("should throw an error if a role is not provided", async () => {
      const user = new User({
        username: "TestUser2",
        email: "test@test.com",
        password: "password",
      });
      await expect(user.validate()).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    });
  });

  describe("Duplicate data", () => {
    it("should throw an error if the username already exists", async () => {
      const user = new User({
        username: "TestUser1",
        email: "test@test.com",
        password: "password",
        role: new Role({ name: "user" }),
      });
      await expect(user.save()).rejects.toThrow(
        'E11000 duplicate key error collection: test.users index: username_1 dup key: { username: "TestUser1" }'
      );
    });

    it("should throw an error if the email already exists", async () => {
      const user = new User({
        username: "testuser",
        email: "TestUser1@test.com",
        password: "password",
        role: new Role({ name: "user" }),
      });
      await expect(user.save()).rejects.toThrow(
        'E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "TestUser1@test.com" }'
      );
    });
  });

  describe("Invalid data", () => {
    // work in progress
    it("should throw an error if the username is empty", async () => {
      const role = await Role.findOne({ name: "user" }).orFail();
      const invalidUser = new User({
        username: "",
        email: "example@example.com",
        password: "password",
        role: role._id,
      });
      await expect(invalidUser.validate()).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it("should throw an error if the email is invalid (or empty)", async () => {
      // includes testing if the email is empty - empty is also invalid
      const role = await Role.findOne({ name: "user" }).orFail(); // keep role valid
    
      const invalidUser = new User({
        username: "example1",
        email: "example.com", // invalid email
        password: "password",
        role: role._id,
      });
    
      await expect(invalidUser.validate())
        .rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it("should throw an error if password is empty", async () => {
      const role = await Role.findOne({ name: "user" }).orFail();
      const invalidUser = new User({
        username: "example2",
        email: "example@example.com",
        password: "",
        role: role._id,
      });
      await expect(invalidUser.validate()).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it("should throw an error if role is not one of the 4 roles in the Role collection", async () => {
      // Roles have been assigned directly in the above tests, but the application actually fetches for it first
      // This forces the mongoose "enum" validation to check for the roles.

      const invalidRole = await Role.findOne({ name: "invalid role" });

      const invalidUser = new User({
        username: "example3",
        email: "example@example.com",
        password: "password",
        role: invalidRole,
      });
      await expect(invalidUser.validate()).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    });
  });
});
