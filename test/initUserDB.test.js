require("dotenv").config();

const mongoose = require("mongoose");
const { initUserDB, connectDB, disconnectDB } = require("../helpers/database");

const User = require("../models/User");
const Role = require("../models/Role");

// stub logger commands using sinon
var logger = require("../utils/logger");
var sinon = require('sinon');

var chai = require("chai");
var expect = chai.expect;

describe("helpers/database.js", function () {
    describe("initUserDB()", function () {

        let infoLogStub;

        before(async function (){
          infoLogStub = sinon.stub(logger, "info"); // hide winston info logs
          await connectDB();
        });

        beforeEach(async function () {
          await initUserDB();
        });

        afterEach(async function () {
          // empty for now
        });
      
        after(async function () {
          await disconnectDB();
          logger.info.restore();
        });

        it("should create exactly 3 roles in the Role collection", async () => {
          const roles = await Role.find();
          expect(roles.length).to.equal(3);
        })
      
        it("should create 3 roles (standard/paid/admin) in the Role collection", async () => {
          const roles = await Role.find();
          expect(roles.length).to.equal(3);
          expect(roles[0].name).to.equal("admin");
          expect(roles[1].name).to.equal("paiduser");
          expect(roles[2].name).to.equal("user");
        });
      
        it("should create a User with the role name set to 'user'", async () => {
          const user = await User.findOne({ username: "TestUser1" }).populate("role");
          expect(user.role.name).to.equal("user");
        });
      
        it("should create a Paid User with the role name 'paiduser'", async () => {
          const paidUser = await User.findOne({ username: "PaidUser1" }).populate(
            "role"
          );
          expect(paidUser.role.name).to.equal("paiduser");
        });
      
        it("should create an Admin with the role name 'admin'", async () => {
          const admin = await User.findOne({ username: "TestAdmin1" }).populate(
            "role"
          );
          expect(admin.role.name).to.equal("admin");
        });
      });
});
