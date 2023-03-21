// https://data.police.uk/docs/method/crime-street/ - Uk crime data by street
// can search by lat and long and relate it to a search object.

const axios = require("axios");

const CrimeList = require("../models/CrimeList");
const Crime = require("../models/Crime");

async function getCrimeData(lat, long) {
    const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${long}`;
    const response = await axios.get(url);

    // returns the crimes in the most recent month
    const existingCrimeList = await CrimeList.findOne({latitude: lat});
    if (existingCrimeList) {
        console.log("Existing crime list found, ID:", existingCrimeList.crimeListID)
        return;
    } else {
        await processCrimeData(lat, long, response.data);
    }

    return;
}

async function processCrimeData(lat, long, rawCrimeData) {
    // model the Crime and categorise it too for paid / admins.
    // lat long to differentiate crime lists

    const newCrimeList = new CrimeList({
        crimeListID: 1,
        latitude: lat,
        longitude: long,
        count: rawCrimeData.length,
        date: rawCrimeData[0].month,
    });

    for (const data of rawCrimeData) {

        const existingCrime = await Crime.findOne({crimeID: data.id});
        if (existingCrime) {
            continue;
        }

        //console.log(data);
        const newCrime = await Crime.create({
            crimeID: data.id,
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            crime_category: data.category,
            crime_date: data.month,
        });

        if (data.outcome_status) {
            newCrime.outcome_category = data.outcome_status.category;
            newCrime.outcome_date = data.outcome_status.month;
        }

        newCrimeList.crimes.push(newCrime);
    }

    await newCrimeList.save();

}

module.exports = {
    getCrimeData,
};
