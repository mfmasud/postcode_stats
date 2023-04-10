const { AbilityBuilder, createMongoAbility } = require("@casl/ability");

const logger = require("../utils/logger");

/**
 * Defines a user's permissions/abilities for the /users route. Also incorporates the readAll permission for admins.
 *
 * @function defineAbilitiesFor
 *
 * @param {Mongoose.Model} user - The mongoose User model to check permissions against.
 * @param {Mongoose.Model} [UserModel] - Another (optional) User model to check permissions against.
 *
 * @returns A CASL ability object defining the user's permissions for the /users route.
 *
 */
function defineAbilitiesFor(user) {
  /*
  if (user.username && user.role.name) {
    logger.info(`current user: ${user.username}`);
    logger.info(`current role: ${user.role.name}`);
  } else {
    logger.info(`current user: none`)
  }
  */

  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // non authenticated users
  can("create", "User"); // register

  // authenticated users
  // standard users
  if (user.role.name === "user") {
    //logger.info('standard user role')

    can("read", "User", { _id: user._id }); // can read own details except for password/passwordSalt
    cannot("read", "AllUsers"); // cannot read other user's details
    cannot("read", "UserPassword");

    can("update", "User", { _id: user._id }); // only for the fields: ‘firstName’, ‘lastName’, ‘about’, ‘password’, ‘email’, ‘avatarURL’
    can("delete", "User", { _id: user._id });
  }

  // paid users
  if (user.role.name === "paid") {
    //logger.info('paid user role')

    can("read", "User", { _id: user._id }); // can read own details except for password/passwordSalt
    cannot("read", "AllUsers"); // cannot read other user's details
    cannot("read", "UserPassword");

    can("update", "User", { _id: user._id }); // only for the fields: ‘firstName’, ‘lastName’, ‘about’, ‘password’, ‘email’, ‘avatarURL’
    can("delete", "User", { _id: user._id });
  }

  // admin users
  if (user.role.name === "admin") {
    //logger.info('admin user role')

    can("read", "User");
    can("read", "UserPassword");
    can("read", "AllUsers");
    can("update", "User");
    can("delete", "User");

    cannot("delete", "User", { _id: user._id }); // can't delete own account
  }

  return build();
}

module.exports = defineAbilitiesFor;
