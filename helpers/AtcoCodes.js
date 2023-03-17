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

// API for transport nodes: https://naptan.api.dft.gov.uk/swagger/index.html
// example api call: https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv&atcoAreaCodes=420
// 420 is Warwickshire.

async function queryAtco(format, code) {
    // no validation - needs to be implemented.
    format = format.toString();
    code = code.toString();

    const api = "https://naptan.api.dft.gov.uk/v1/access-nodes";
    const query = `dataFormat=${format}&atcoAreaCodes=${code}`;

    try {
        const response = await axios.get(`${api}?${query}`);
        // response is raw csv data, not an object should be cached and parsed into json
        //const parsed = await processCSV(response);
        //return parsed;
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    getAtcoCodes,
    queryAtco
}
