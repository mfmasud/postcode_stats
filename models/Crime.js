/**
 * @file Contains the mongoose Crime model schema.
 * @module models/Crime
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 * 
 * @requires mongoose
 * 
 * @exports Crime
 * 
 * @see {@link module:models/CrimeList} for the `CrimeList` model which uses these `Crime` models.
 * 
 */

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
  },
});

// lat long from initial query.
// count = response.data.length

module.exports = mongoose.model("Crime", crimeSchema);
