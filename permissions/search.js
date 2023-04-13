/**
 * @file Responsible for defining the abilities users have on the /search route.
 * @module permissions/search
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 * 
 * @requires @casl/ability
 * @requires utils/logger
 * 
 * @exports defineAbilitiesFor
 */

const { AbilityBuilder, createMongoAbility } = require("@casl/ability");

const logger = require("../utils/logger");

/**
 * Defines the user's permissions for the /search route.
 *
 * @function defineAbilitiesFor
 *
 * @param {mongoose.Object} user - The mongoose User model to check permissions for.
 * @param {mongoose.Object} [SearchModel] - Optional mongoose Search model to check permissions against to potentially exclude fields in the future.
 *
 * @returns A CASL ability object defining the user's permissions for the /search route.
 *
 * @see {@link module:routes/search} for the route which uses this function.
 * 
 * @example
 * // Example usage with a mongoose Search model (updating is not yet implemented in the routes - should be doable by admins)
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
  can("create", "Search");

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

    can("create", "RandomSearch");
  }

  return build();
}

module.exports = defineAbilitiesFor;
