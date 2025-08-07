/**
 * @file Contains the Atco model schema.
 * @module models/Atco
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires mongoose
 *
 * @exports Atco
 *
 * @see {@link module:models/BusStop} for the BusStop model which is used by this model schema.
 * @see {@link module:models/Search} for the Search model which links this model.
 * @see {@link module:helpers/AtcoCodes~processCSV} for the function which processes data for this model.
 *
 */

const mongoose = require("mongoose");

const atcoSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  busstops: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusStop",
    },
  ],
  AllProcessed: {
    type: Boolean,
    required: true,
  },
  other_names: [
    {
      type: String,
    },
  ],
});

export default mongoose.model("Atco", atcoSchema);
