// Nptg = National Public Transport Gazetteer - Location names in England, Scotland and Wales.
const mongoose = require("mongoose");

const NptgSchema = new mongoose.Schema({
  NptgLocalityCode: {
    type: String,
    required: true,
  },
  Easting: {
    type: Number,
    required: true,
  },
  Northing: {
    type: Number,
    required: true,
  },
  LocalityName: {
    type: String,
    required: true,
  },
  QualifierName: {
    type: String,
  },
  ParentLocalityName: {
    type: String,
  },
});

module.exports = mongoose.model("Nptg", NptgSchema);
