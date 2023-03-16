// This is the Role model (lol) schema
// might make independent models for each role in the future

const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: "user",
    enum: ["none", "user", "paid", "admin"],
  },
  description: {
    type: String,
  },
});

module.exports = mongoose.model("Role", RoleSchema);
