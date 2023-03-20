const mongoose = require("mongoose");

const crimeSchema = new mongoose.Schema({
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    count: {
        type: Number,
        default: 0,
    },
});

// lat long from initial query.
// count = response.data.length

module.exports = mongoose.model("Crime", crimeSchema);
