require("dotenv").config();

const mongoose = require("mongoose");
const { initUserDB, connectDB, disconnectDB } = require("../helpers/database");

const User = require("../models/User");
const Role = require("../models/Role");

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
 
chai.use(chaiAsPromised);
var expect = chai.expect;

describe("models/User.js", function () {
    describe("userSchema", function () {

        before(async function (){
            await connectDB();
        });

        beforeEach(async function () {
          await initUserDB();
        });
      
        after(async function () {
          await disconnectDB();
        });
      
        it("should ...", async () => {
            //test code
        });
      
        
      });
});
