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

/*
Some tests to be added:
- Test required fields of the schema
- Test duplicates in username and email fields
- Test the role when creating user models - should be one of the 4 roles only
- Test password hashing?
- Test ID autoincrement + deletion - when deleting the most recent user, the id may be set to the same id !!!
*/

describe("models/User.js", function () {
    describe("userSchema", function () {

        let infoLogStub;

        before(async function (){
            infoLogStub = sinon.stub(logger, "info");
            await connectDB();
        });

        beforeEach(async function () {
          await initUserDB();
        });
      
        after(async function () {
          await disconnectDB();
          sinon.restore();
        });
      
        it("should ...", async () => {
            //test code
        });
        
      });
});
