const mongoose = require("mongoose");

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
  },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
});

userSchema.pre("save", async function save(next) {
  if (this.isNew) {
    // if this is a new user then set the id to the next available id, or 1 if there are no users
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

      logger.info(
        `password modified/created for user: ${this.username}\nhashed password: ${this.password}`
      );

      return next();
    } catch (err) {
      return next(err);
    }
  }
});

userSchema.statics.findByUsername = async function findByUsername(username) {
  //logger.info('findByUsername called');
  const user = await this.findOne({ username: username }).populate("role");
  return user;
};

module.exports = mongoose.model("User", userSchema);
