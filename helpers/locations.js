const axios = require("axios");
const JSDOM = require("jsdom").JSDOM;
const csvtojson = require("csvtojson");

async function getScotlandLocations() {
    const url = "https://en.wikipedia.org/wiki/Local_government_in_Scotland";
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
  
    const locations = dom.window.document.querySelectorAll(
      "ol li a"
    );

    const names = [];
  
    locations.forEach((place, index) => {
      if (index < 32) {
        const text = place.textContent.trim();
        names.push(text);
      }
    });
  
    //console.log(names); 
    // Inverclyde to Shetland - all 32
    // Orkney and Shetland needs to have "Islands" for the list.

    return names;
}
  
async function getEnglandLocations() {
    // wip
    const url = "https://en.wikipedia.org/wiki/Local_government_in_Scotland";
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);

    const options = dom.window.document.querySelectorAll(
        "ol li"
    );

    const names = [];

    options.forEach((option) => {
        const text = option.textContent.trim();
        names.push(text);
    });

    console.log(names);
    //codes.shift();

    return names;
}

module.exports = {
getScotlandLocations,
getEnglandLocations,
}
