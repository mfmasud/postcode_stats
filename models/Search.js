/**
 * @file Contains the mongoose schema for the Search model. This model is used to store the results of a search query.
 * @module models/Search
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 * 
 * @requires mongoose
 * 
 * @exports Search
 * 
 * @see {@link module:models/Postcode} for the Postcode model which is used in this schema.
 * @see {@link module:models/BusStop} for the BusStop model which is used in this schema.
 * @see {@link module:models/Crime} for the Crime model which is used in this schema.
 * @see {@link module:models/Atco} for the Atco model which is used in this schema.
 * @See {@link module:models/CrimeList} for the CrimeList model which is used in this schema.
 * @see {@link module:helpers/search} for the helper files used to link data to the model.
 * @see {@link module:routes/search} for the routes which uses this model.
 * 
 */

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
  _links: {
    self: {
      href: {
        type: String,
      },
    },
    postcode: {
      href: {
        type: String,
      }
    },
    alternate: {
      href: {
        type: String,
      }
    },
  },
});

searchSchema.pre("save", async function save(next) {
  if (this.isNew) {
    // if this is a new search then set the id to the next available id
    const maxId = await this.constructor.find().sort("-searchID").limit(1);
    this.searchID = maxId.length ? maxId[0].searchID + 1 : 1;
  }
  next();
});

module.exports = mongoose.model("Search", searchSchema);
