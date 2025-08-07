/**
 * @file Contains the mongoose CrimeList model schema. Sums up the results of a query made to the Police API so that it can be used by and linked to the Search model.
 * @module models/CrimeList
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires mongoose
 *
 * @exports CrimeList
 *
 * @see {@link module:models/Crime} for the Crime model which is used in this model's crimes field.
 * @see {@link module:models/Search} for the Search model which links this model.
 * @see {@link module:helpers/crime} for the helper functions used to retrieve data for this model.
 *
 */

const mongoose = require("mongoose");

const crimeListSchema = new mongoose.Schema({
  crimeListID: {
    type: Number,
    required: true,
  },
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
  crimes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crime",
    },
  ],
  date: {
    type: String,
  },
  emptydata: {
    type: Boolean,
    default: false,
  },
});

crimeListSchema.pre("save", async function save(next) {
  if (this.isNew) {
    const maxId = await this.constructor.find().sort("-crimeListID").limit(1);
    this.id = maxId.length ? maxId[0].crimeListID + 1 : 1;
  }
  return next(); // next middleware in call stack
});

module.exports = mongoose.model("CrimeList", crimeListSchema);
