// https://data.police.uk/docs/method/crime-street/ - Uk crime data by street
// can search by lat and long and relate it to a search object.

const axios = require("axios");

async function getCrimeData(lat, long) {
    const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${long}`;
    const response = await axios.get(url);

    // returns the crimes in the most recent month

    console.log(response.data); // can be modelled later.
    console.log(response.data.length); // e.g. 294

    /* data to be modelled:
    response.data - a large JSON array.

    TODO when I wake up:
    - location JSON - can be split to latitude and longitude
    - month (2023-01) - can be split up
    - Can count the number of crimes by taking length:
    data.length = 294 for LU1 5PP
    - Maybe categorise / break down for paid users
    - easy enough to implement using a set and a counter
    - Calculate the number somewhere else or in another function
    */

    return await processCrimeData(response.data);
}

async function processCrimeData(rawCrimeData) {
    // model the Crime and categorise it too for paid / admins.
}

module.exports = {
    getCrimeData,
};
