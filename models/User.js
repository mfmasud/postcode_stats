/**
 * @file Contains the User model schema and exported model used to authenticate users. Originally based off of 6003CEM lab work.
 * @module models/User
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires mongoose
 * @requires validator
 * @requires utils/logger
 * @requires bcrypt
 *
 * @exports User
 *
 * @see {@link module:routes/users} for the routes which perform CRUD operations on this model.
 * @see {@link module:models/Role} for the Role model used in this schema.
 * @see {@link module:controllers/auth} for the authentication middleware used in the routes.
 * @See {@link https://stackoverflow.com/a/28396238} for more on the approach used to validate email addresses.
 *
 */

const mongoose = require("mongoose");

/* validation: 
https://mongoosejs.com/docs/validation.html
https://pinoria.com/how-to-validate-email-syntax-with-mongoose/
https://stackoverflow.com/a/28396238
https://github.com/validatorjs/validator.js
*/
const { isEmail } = require("validator");

const logger = require("../utils/logger");

const bcrypt = require("bcrypt"); // https://www.npmjs.com/package/bcrypt
const saltRounds = 10;

const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
  },
  firstName: String,
  lastName: String,
  username: {
    type: String,
    required: true,
    unique: true,
  },
  about: String,
  dateRegistered: {
    type: Date,
    default: Date.now,
  },
  password: {
    type: String,
    required: true,
  },
  passwordSalt: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [isEmail, "invalid email"],
  },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
});

userSchema.pre("save", async function save(next) {
  if (this.isNew) {
    // if this is a new user then set the id to the next available id, or 1 if there are no users
    // bug: deleting the most recent user then creating another will assign the same ID
    // potential solution: link to a sequence/counter model and use that instead
    // https://stackoverflow.com/a/30164636
    const maxId = await this.constructor.find().sort("-id").limit(1);
    this.id = maxId.length ? maxId[0].id + 1 : 1; //javascript ternary operator - condition ? if : else
  }

  // check if password was modified or created e.g. new user

  // http://blog.mongodb.org/post/32866457221/password-authentication-with-mongoose-part-1
  if (!this.isModified("password")) {
    // if it wasnt then return the next middleware in the stack
    return next();
  } else {
    // if it was modified (or created) then hash the password
    try {
      const salt = await bcrypt.genSalt(saltRounds);
      this.passwordSalt = salt;
      this.password = await bcrypt.hash(this.password, salt);

      logger.info(`password modified/created for user: ${this.username}`);
      //logger.info(`hashed password: ${this.password}`);

      return next();
    } catch (err) {
      return next(err);
    }
  }
});

userSchema.statics.findByUsername = async function findByUsername(username) {
  //logger.info('findByUsername called');
  let user = await this.findOne({ username: username });
  if (user) {
    user = await user.populate("role");
    return user;
  }
};

module.exports = mongoose.model("User", userSchema);
