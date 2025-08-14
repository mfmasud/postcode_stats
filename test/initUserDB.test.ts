require("dotenv").config();

import mongoose from "mongoose";
import { initUserDB, connectDB, disconnectDB } from "../helpers/database.js";

import User from "../models/User.js";
import Role from "../models/Role.js";
import type { RoleDoc } from "../models/Role.js";

// stub logger commands using vi -> https://12tech.io/12tech-blog/unit-testing-with-jest-and-vitest
//var sinon = require("sinon");

//var chai = require("chai");
//var expect = chai.expect;

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import logger from "../utils/logger.js";

describe("helpers/database.js", function () {
  let infoLogStub: ReturnType<typeof vi.spyOn>;

  beforeAll(async function () {
    //infoLogStub = vi.spyOn(logger, "info"); // hide winston info logs
    await connectDB();
  });

  beforeEach(async function () {
    await initUserDB();
  });

  afterAll(async function () {
    await disconnectDB();
    //infoLogStub.mockRestore();
  });

  describe("Check Role collection", function () {
    it("should create exactly 4 roles in the Role collection", async () => {
      const roles = await Role.find();
      return expect(roles.length).to.equal(4);
    });

    it("should create 4 roles (none/standard/paid/admin) in the Role collection", async () => {
      const roles = await Role.find();
      const roleNames = roles.map((role) => role.name);
      expect(roleNames).to.deep.equal(["admin", "paiduser", "user", "none"]);
    });

    it("should create a User with the role name set to 'user'", async () => {
      const user = await User.findOne({ username: "TestUser1" }).populate<{ role: RoleDoc }>("role");

      expect(user).to.not.be.null;
      if (user) {
        expect(user.role.name).to.equal("user");
      }
    });

    it("should create a Paid User with the role name 'paiduser'", async () => {
      const paidUser = await User.findOne({ username: "PaidUser1" }).populate<{ role: RoleDoc }>("role");

      expect(paidUser).to.not.be.null;
      if (paidUser) {
        expect(paidUser.role.name).to.equal("paiduser");
      }
    });

    it("should create an Admin with the role name 'admin'", async () => {
      const admin = await User.findOne({ username: "TestAdmin1" }).populate<{ role: RoleDoc }>("role");

      expect(admin).to.not.be.null;
      if (admin) {
        expect(admin.role.name).to.equal("admin");
      }
    });
  });

  describe("Check User collection", () => {
    it("should not have TestUser2", async () => {
      const user = await User.findOne({ username: "TestUser2" });
      return expect(user).to.not.exist;
    });

    it("should create 'TestUser1'", async () => {
      const user = await User.findOne({ username: "TestUser1" });
      expect(user).to.exist;
      return expect(user?.username).to.equal("TestUser1");
    });

    it("should create 'PaidUser1'", async () => {
      const paidUser = await User.findOne({ username: "PaidUser1" });
      expect(paidUser).to.exist;
      return expect(paidUser?.username).to.equal("PaidUser1");
    });

    it("should create 'TestAdmin1'", async () => {
      const admin = await User.findOne({ username: "TestAdmin1" });
      expect(admin).to.exist;
      return expect(admin?.username).to.equal("TestAdmin1");
    });
  });
});
