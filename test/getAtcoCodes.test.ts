/*
Mocha - https://mochajs.org/#getting-started 
Mocha assertions info - https://mochajs.org/#assertions
Mocha before/after hooks - https://mochajs.org/#hooks

Chai - https://www.chaijs.com/api/assert/#method_isarray

Helpful:
Blog - https://blog.logrocket.com/node-js-unit-testing-mocha-chai-sinon/
Cheatsheet - https://devhints.io/chai
*/

// code to test
import { getAtcoCodes } from "../helpers/AtcoCodes.js";

// testing tools
//var chai = require("chai");
//var expect = chai.expect;

import { describe, it, expect, beforeAll } from "vitest";

describe("helpers/AtcoCodes.js", function () {
  let codes: string[];
  beforeAll(async function () {
    // runs once before the first test in this block
    codes = await getAtcoCodes();
  });

  describe("Check for Array", function () {
    it("should be an array", function () {
      // check if it is an array
      return expect(codes).to.be.an("array");
    });

    // make sure array returns some values
    it("should not be an empty array", function () {
      // check if it is not empty
      return expect(codes).to.not.be.empty;
    });

    // codes can change if the website is updated
    it("should have 147 codes", function () {
      // check if the array length is equal to 147
      return expect(codes).to.have.lengthOf(147);
    });

    // Below are assigned at a later function.
    it("should not have a location property yet", function () {
      codes.forEach((code) => {
        return expect(code).to.not.have.property("location");
      });
    });

    it("should not have a region property yet", function () {
      codes.forEach((code) => {
        return expect(code).to.not.have.property("region");
      });
    });
  });

  describe("Check Array Values", () => {
    it("should have the 'Aberdeenshire' location as the first value in the array", () => {
      return expect(codes[0]).to.equal("Aberdeenshire / Scotland (630)");
    });

    it("should have the 'Greater London' location as the 50th value in the array", () => {
      return expect(codes[49]).to.equal("Greater London / London (490)");
    });

    it("should have the 'York' location as the last value in the array", () => {
      return expect(codes[146]).to.equal("York / Yorkshire (329)");
    });
  });
});
