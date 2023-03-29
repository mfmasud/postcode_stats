const mongoose = require("mongoose");

const busStopSchema = new mongoose.Schema({
    ATCO_long: {
      type: String,
      required: true,
    },
    ATCO_short: {
      type: String,
    },
    CommonName: {
      type: String,
    },
    Street: {
      type: String,
    },
    Longitude: {
      type: String,
    },
    Latitude: {
      type: String,
    },
    Northing: {
      type: String,
      required: true,
    },
    Easting: {
      type: String,
      required: true,
    },
  });
  
  /* commented out because I am now doing this when assigning the document fields in the first place.
  busStopSchema.pre("save", async function (next) {
      this.ATCO_short = this.ATCO_long.slice(0, 3);
      next();
  });
  */

  module.exports = mongoose.model("BusStop", busStopSchema);
  