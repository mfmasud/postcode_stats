require("dotenv").config();

const mongoose = require("mongoose");
const { initUserDB, connectDB, disconnectDB } = require("../helpers/database");

const User = require("../models/User");
const Role = require("../models/Role");

// Note: sinon could potentially be used to stub the logger commands/prints
// Or the logger can detect if a test is being run and save to a different place or something

var chai = require("chai");
var expect = chai.expect;

describe("helpers/database.js", function () {
    describe("initUserDB()", function () {

        before(async function (){
            await connectDB();
        });

        beforeEach(async function () {
          await initUserDB();
        });
      
        after(async function () {
          await disconnectDB();
        });
      
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
      
        it("should create a PaidUser with the role name 'paiduser'", async () => {
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
