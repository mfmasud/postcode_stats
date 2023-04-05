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


describe('getAtcoCodes Function', function () {
  describe('getAtcoCodes()', async function () {
    // call function
    const codes = await getAtcoCodes();

    it('Should be an array', async function (codes) {
      // check if it is an array
    });

    // make sure array returns some values
    it('Should not be empty', async function (codes) {
      // check if it is not empty
    });

    // codes can change if the website is updated
    it('Should have 147 codes', async function (codes) {
      // check if the array length is equal to 147
    });

  });
});