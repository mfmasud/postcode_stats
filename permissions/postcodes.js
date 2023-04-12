/**
 * @file Defines the CASL ability for users accessing the /postcodes route.
 * @module permissions/postcodes
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
 * Defines the user's permissions for the /postcodes route.
 *
 * @function defineAbilitiesFor
 *
 * @param {mongoose.Object} user - The mongoose User model to check permissions for.
 * @param {mongoose.Object} [PostcodeModel] - Optional mongoose Postcode model to check permissions against with can/cannot.
 *
 * @returns A CASL ability object defining the user's permissions for the /postcodes route.
 * 
 * @see {@link module:routes/postcodes} for the route which uses this function.
 * 
 */
function defineAbilitiesFor(user) {
  //logger.info(`current user: ${user.username}\nrole: ${user.role.name}`)

  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // non authenticated users

  // authenticated users
  // standard users
  if (user.role.name === "user") {
    //logger.info('standard user role')

    can("read", "Postcode");
  }

  // paid users
  if (user.role.name === "user") {
    //logger.info('standard user role')

    can("read", "Postcode");
  }

  // admin users
  if (user.role.name === "admin") {
    //logger.info('admin user role')

    can("readAll", "Postcode");
    can("read", "Postcode");
  }

  return build();
}

module.exports = defineAbilitiesFor;
