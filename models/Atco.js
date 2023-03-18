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
});

module.exports = mongoose.model("Atco", atcoSchema);
