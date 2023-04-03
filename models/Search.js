const mongoose = require("mongoose");

const searchSchema = new mongoose.Schema({
  searchID: {
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
  Northing: {
    type: String,
    required: true,
  },
  Easting: {
    type: String,
    required: true,
  },
  reverseLookup: {
    type: Boolean,
    default: false,
  },
  Postcode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Postcode",
  },
  queryBusStops: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusStop",
    },
  ],
  queryCrimes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crime",
    },
  ],
  linkedATCO: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Atco",
  },
  linkedCrimeList: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CrimeList",
  },
});

// query bus stops - selected bus stops matching a query e.g. within radius of lat and long.

searchSchema.pre("save", async function save(next) {
  if (this.isNew) {
    // if this is a new search then set the id to the next available id
    const maxId = await this.constructor.find().sort("-searchID").limit(1);
    this.searchID = maxId.length ? maxId[0].searchID + 1 : 1;
  }
  next();
});

module.exports = mongoose.model("Search", searchSchema);
