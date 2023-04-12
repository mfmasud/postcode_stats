/**
 * @file Contains the Postcode model schema, a shortened version of the data returned by the Postcode API.
 * @module models/Postcode
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 * 
 * @requires mongoose
 * 
 * @exports Postcode
 * 
 * @see {@link module:models/Search} which uses this `Postcode` model.
 * @see {@link module:routes/postcodes} for the route which uses this model.
 * @See {@link module:helpers/postcodes} for the helper files which uses these models.
 */

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
