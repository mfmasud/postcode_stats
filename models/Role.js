const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: "user",
    enum: ["none", "user", "paiduser", "admin"],
  },
  description: {
    type: String,
  },
});

module.exports = mongoose.model("Role", RoleSchema);
