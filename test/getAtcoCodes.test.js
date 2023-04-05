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
const {getAtcoCodes} = require("../helpers/AtcoCodes");

// testing tools
var chai = require("chai");
var expect = chai.expect;
var assert = chai.assert;


describe('helpers/AtcoCodes.js', function () {
  describe('getAtcoCodes()', function () {

    let codes;
    before(async function () {
      // runs once before the first test in this block
      codes = await getAtcoCodes();
    });

    it('Should be an array', function () {
      // check if it is an array
      expect(codes).to.be.an('array');
    });

    // make sure array returns some values
    it('Should not be empty', function () {
      // check if it is not empty
      expect(codes).to.not.be.empty;
    });

    // codes can change if the website is updated
    it('Should have 147 codes', function () {
      // check if the array length is equal to 147
      expect(codes).to.have.lengthOf(147);
    });

  });
});