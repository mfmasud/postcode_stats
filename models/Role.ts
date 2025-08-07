/**
 * @file Contains the Role model schema which is used by the User model to assign access levels to users.
 * @module models/Role
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires mongoose
 *
 * @exports Role
 *
 * @see {@link module:models/User} for the User model which has a role field which uses this model.
 *
 */

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

export default mongoose.model("Role", RoleSchema);
