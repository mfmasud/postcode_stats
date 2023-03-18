const mongoose = require("mongoose");

const postcodeSchema = new mongoose.Schema({
  postcode: {
    type: String,
    required: true,
  },
  eastings: {
    type: Number,
  },
  northings: {
    type: Number,
  },
  country: {
    type: String,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  parliamentary_constituency: {
    type: String,
  },
  admin_district: {
    type: String,
  },
  admin_ward: {
    type: String,
  },
  parish: {
    type: String,
  },
  admin_county: {
    type: String,
  },
});

module.exports = mongoose.model("Postcode", postcodeSchema);
