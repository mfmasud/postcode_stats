const busStopSchema = new mongoose.Schema({
    ATCO_long: {
      type: String,
      required: true,
    },
    ATCO_short: {
      type: String,
    },
    NaptanCode: {
      type: String,
      required: true,
    },
    CommonName: {
      type: String,
      required: true,
    },
    Street: {
      type: String,
      required: true,
    },
    LocalityName: {
      type: String,
      required: true,
    },
    ParentLocalityName: {
      type: String,
    },
    Longitude: {
      type: String,
      required: true,
    },
    Latitude: {
      type: String,
      required: true,
    },
    Status: {
      type: String,
      enum: ["active", "inactive"],
      required: true,
    },
  });
  
  busStopSchema.pre("save", async function (next) {
      this.ATCO_short = this.ATCO_long.slice(0, 3);
      next();
  });
  
  module.exports = mongoose.model("BusStop", busStopSchema);
  