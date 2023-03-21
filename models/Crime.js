const mongoose = require("mongoose");

const crimeSchema = new mongoose.Schema({
    crimeID: {
        type: Number,
    },
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    crime_category: {
        type: String,
    },
    crime_date: {
        type: String,
    },
    outcome_category: {
        type: String,
    },
    outcome_date: {
        type: String,
    }

});

// lat long from initial query.
// count = response.data.length

module.exports = mongoose.model("Crime", crimeSchema);
