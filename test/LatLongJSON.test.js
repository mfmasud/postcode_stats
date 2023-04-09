// Test latitude and longitude validation

const latlongSchema = require("../schemas/latlong.json");

const Ajv = require("ajv");
const ajv = new Ajv();

const validateLatLong = ajv.compile(latlongSchema);

var chai = require("chai");
var expect = chai.expect;

describe("schemas/latlong.json", function () {
  describe("Invalid Data Types", function () {
    it("should not accept an empty object as data", () => {
      const data = {};
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });

    it("should not accept a string as the data", () => {
      const data = "invalid";
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });

    it("should not accept a number as the data", () => {
      const data = 5;
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });

    // mixed data types
    it("should not accept a string as the latitude value", () => {
      const data = { latitude: "25", longitude: 25 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });

    it("should not accept a string as the longitude value", () => {
      const data = { latitude: 25, longitude: "25" };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });

    it("should not accept a valid coordinate pair as strings", () => {
      // valid data, but should reject as the schema is for numbers.
      const data = { latitude: "51.903", longitude: "-0.414" };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });
  });

  describe("Missing Input Data", function () {
    it("should not accept an empty coordinate pair", () => {
      const data = { latitude: undefined, longitude: undefined };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });

    it("should not accept an empty lat value", () => {
      const data = { latitude: undefined, longitude: -90 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });

    it("should not accept an empty long value", () => {
      const data = { latitude: 90, longitude: undefined };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });
  });

  describe("Normal Data", function () {
    // could just chain some of these but I have kept them separate
    it("should accept a valid coordinate pair", () => {
      const data = { latitude: 15, longitude: 25 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.true;
    });

    it("should accept a valid UK coordinate pair", () => {
      const data = { latitude: 51.903, longitude: -0.414 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.true;
    });

    it("should not accept an invalid coordinate pair", () => {
      const data = { latitude: 100, longitude: 200 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });

    it("should not accept latitude < -90", () => {
      const data = { latitude: -100, longitude: 0 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });

    it("should accept latitude === -90", () => {
      const data = { latitude: -90, longitude: 0 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.true;
    });

    it("should not accept latitude > 90", () => {
      const data = { latitude: 100, longitude: 0 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });

    it("should accept latitude === 90", () => {
      const data = { latitude: 90, longitude: 0 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.true;
    });

    it("should not accept longitude < -180", () => {
      const data = { latitude: 0, longitude: -200 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });

    it("should accept longitude === -180", () => {
      const data = { latitude: 0, longitude: -180 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.true;
    });

    it("should not accept longitude > 180", () => {
      const data = { latitude: 0, longitude: 200 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.false;
    });

    it("should accept longitude === 180", () => {
      const data = { latitude: 0, longitude: 180 };
      const isValid = validateLatLong(data);
      expect(isValid).to.be.true;
    });
  });
});
