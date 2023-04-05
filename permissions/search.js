const { AbilityBuilder, createMongoAbility } = require("@casl/ability");

const logger = require("../utils/logger");

/**
 * Defines the user's permissions for the /search route.
 *
 * @function defineAbilitiesFor
 *
 * @param {Mongoose.Model} user - The mongoose User model to check permissions against.
 * @param {Mongoose.Model} [SearchModel] - Optional mongoose Search model to check permissions against to potentially exclude fields in the future.
 *
 * @returns A CASL ability object defining the user's permissions for the /search route.
 *
 * @example
 * // Example usage with a mongoose Search model (not yet implemented in the route - should be doable by admins)
 * const defineAbilitiesFor = require('./permissions/search')
 * const ability = defineAbilitiesFor(user, SearchModel)
 * if (ability.can('update', 'Search')) {
 *  logger.info("user is allowed to update this Search.")
 * } else {
 *  logger.info("user is not allowed update this Search.")
 * }
 */
function defineAbilitiesFor(user) {
  // can use Search Model in the future.
  //logger.info(`current user: ${user.username}\nrole: ${user.role.name}`)

  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // non authenticated users
  can("read", "Search");

  // authenticated users
  // standard users
  if (user.role.name === "user") {
    //logger.info('standard user role')
  }

  // paid users
  if (user.role.name === "paiduser") {
    //logger.info('paid user role')
  }

  // admin users
  if (user.role.name === "admin") {
    //logger.info('admin user role')

    can("read", "RandomSearch");
  }

  return build();
}

module.exports = defineAbilitiesFor;
