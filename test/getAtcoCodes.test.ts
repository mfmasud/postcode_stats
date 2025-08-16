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
import { getAtcoCodes, processAtcoString } from "../helpers/AtcoCodes.js";
import type { ProcessedAtcoCode, AtcoCode } from "../types/atco.js";

import { describe, it, expect, beforeAll } from "vitest";

describe("helpers/AtcoCodes.js", function () {
  let codes: string[];
  let entries : number;
  beforeAll(async function () {
    // runs once before the first test in this block
    codes = await getAtcoCodes();
    entries = codes.length;
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
    it("should have 148 codes", function () {

      // 148 is the most recent number of entries in the master atco list
      expect(entries).to.equal(148);

      // check if the array length is equal to 148
      expect(codes).to.have.lengthOf(148);
    });

    // Below are assigned after the atco codes are processed.
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
      return expect(codes[entries - 1]).to.equal("York / Yorkshire (329)");
    });
  });

  describe("Northamptonshire Split Validation (ATCO 300/305)", () => {
    // Reference: https://beta-naptan.dft.gov.uk/article/how-to-request-an-atco-code-split
    // Reference: https://beta-naptan.dft.gov.uk/article/atco-codes-in-use
    
    it("should contain West Northamptonshire with code 300", () => {
      const westNorthamptonshire = codes.find(code => 
        code.includes("West Northamptonshire") && code.includes("(300)")
      );
      expect(westNorthamptonshire).to.not.be.undefined;
      expect(westNorthamptonshire).to.equal("West Northamptonshire / East Midlands (300)");
    });

    it("should contain North Northamptonshire with code 305", () => {
      const northNorthamptonshire = codes.find(code => 
        code.includes("North Northamptonshire") && code.includes("(305)")
      );
      expect(northNorthamptonshire).to.not.be.undefined;
      expect(northNorthamptonshire).to.equal("North Northamptonshire / East Midlands (305)");
    });

    it("should NOT contain the old 'Northamptonshire' entry", () => {
      const oldNorthamptonshire = codes.find(code => 
        code.includes("Northamptonshire / East Midlands (300)") && 
        !code.includes("West") && 
        !code.includes("North")
      );
      expect(oldNorthamptonshire).to.be.undefined;
    });

    it("should have exactly two Northamptonshire-related entries (West and North)", () => {
      const northamptonshireEntries = codes.filter(code => 
        code.toLowerCase().includes("northamptonshire")
      );
      expect(northamptonshireEntries).to.have.lengthOf(2);
      
      const hasWest = northamptonshireEntries.some(entry => entry.includes("West Northamptonshire"));
      const hasNorth = northamptonshireEntries.some(entry => entry.includes("North Northamptonshire"));
      
      expect(hasWest).to.be.true;
      expect(hasNorth).to.be.true;
    });

    it("should validate that codes 300 and 305 are both present and correctly assigned", () => {
      const code300Entry = codes.find(code => code.includes("(300)"));
      const code305Entry = codes.find(code => code.includes("(305)"));
      
      expect(code300Entry).to.not.be.undefined;
      expect(code305Entry).to.not.be.undefined;
      expect(code300Entry).to.include("West Northamptonshire");
      expect(code305Entry).to.include("North Northamptonshire");
    });
  });

  describe("processAtcoString function", () => {
    it("should correctly process a valid ATCO string", async () => {
      const testInput = "Aberdeenshire / Scotland (630)";
      const result = await processAtcoString(testInput);
      
      expect(result).to.be.an("object");
      expect(result).to.have.property("630");
      expect(result["630"]).to.deep.equal({
        location: "Aberdeenshire",
        region: "Scotland"
      });
    });

    it("should handle complex location names with spaces", async () => {
      const testInput = "East Riding of Yorkshire / Yorkshire (220)";
      const result = await processAtcoString(testInput);
      
      expect(result).to.be.an("object");
      expect(result).to.have.property("220");
      expect(result["220"]).to.deep.equal({
        location: "East Riding of Yorkshire",
        region: "Yorkshire"
      });
    });

    it("should throw an error for invalid ATCO string format", async () => {
      const invalidInputs = [
        "Invalid format",
        "Location only (123)",
        "/ Region (456)",
        "Location / Region",
        "Location / (789)"
      ];

      for (const invalidInput of invalidInputs) {
        try {
          await processAtcoString(invalidInput);
          expect.fail(`Expected error for input: ${invalidInput}`);
        } catch (error) {
          expect(error).to.be.an("error");
          expect((error as Error).message).to.include("Invalid ATCO code format");
          expect((error as Error).message).to.include(invalidInput);
        }
      }
    });

    it("should validate that returned object has correct structure and types", async () => {
      const testInput = "Greater London / London (490)";
      const result: ProcessedAtcoCode = await processAtcoString(testInput);
      
      // Check object structure
      expect(result).to.be.an("object");
      expect(Object.keys(result)).to.have.lengthOf(1);
      
      // Check that the key is the ATCO code
      const atcoCode = Object.keys(result)[0] as AtcoCode;
      expect(atcoCode).to.equal("490");
      
      // Check that the value has the correct structure
      const atcoInfo = result[atcoCode];
      expect(atcoInfo).to.not.be.undefined;
      expect(atcoInfo).to.be.an("object");
      
      if (atcoInfo) {
        expect(atcoInfo).to.have.property("location");
        expect(atcoInfo).to.have.property("region");
        expect(atcoInfo.location).to.be.a("string");
        expect(atcoInfo.region).to.be.a("string");
        expect(atcoInfo.location).to.equal("Greater London");
        expect(atcoInfo.region).to.equal("London");
      }
    });

    it("should successfully process the new split Northamptonshire entries", async () => {
      const westInput = "West Northamptonshire / East Midlands (300)";
      const westResult: ProcessedAtcoCode = await processAtcoString(westInput);
      
      expect(westResult).to.be.an("object");
      expect(westResult).to.have.property("300");
      expect(westResult["300"]).to.deep.equal({
        location: "West Northamptonshire",
        region: "East Midlands"
      });

      const northInput = "North Northamptonshire / East Midlands (305)";
      const northResult: ProcessedAtcoCode = await processAtcoString(northInput);
      
      expect(northResult).to.be.an("object");
      expect(northResult).to.have.property("305");
      expect(northResult["305"]).to.deep.equal({
        location: "North Northamptonshire",
        region: "East Midlands"
      });
    });
  });
});
