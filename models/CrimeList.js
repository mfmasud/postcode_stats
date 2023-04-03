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
