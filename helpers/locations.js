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

        if (text === "Orkney") {
          text = "Orkney Islands";
        } else if (text === "Shetland") {
          text = "Shetland Islands";
        } else if (text === "Na h-Eileanan Siar") {
          text = "Western Islands";
        } else if (text === "Argyll and Bute") {
          text = "Argyll & Bute";
        } else if (text === "Dumfries and Galloway") {
          text = "Dumfries & Galloway";
        }

        names.push(text);
      }
    });
  
    //console.log(names); 
    // Inverclyde to Shetland - all 32
    // Orkney and Shetland needs to have "Islands" for the list.
    // In the ATCO list, "Western Islands" refers to Na h-Eileanan Siar

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
