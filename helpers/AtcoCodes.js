/*
web scraping and parsing HTML in javascript:
https://www.twilio.com/blog/web-scraping-and-parsing-html-in-node-js-with-jsdom

related note:
docs/notes/atco_codes.txt
*/

const axios = require('axios');
const JSDOM = require('jsdom').JSDOM;

// URL has a dropdown with all the local authorities and ATCO codes
const url = "https://beta-naptan.dft.gov.uk/download/la";

async function getAtcoCodes() {
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);

    const options = dom.window.document.querySelectorAll('#localAuthorityName option');

    const codes = [];

    options.forEach(option => {
      const text = option.textContent.trim();
      codes.push(text);
    });

    return codes;

}

module.exports = {
    getAtcoCodes
}
