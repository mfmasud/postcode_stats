const { AbilityBuilder, createMongoAbility } = require("@casl/ability");

/**
 * Defines the user's permissions for the /postcodes route.
 * 
 * @function defineAbilitiesFor
 * 
 * @param {Mongoose.Model} user - The mongoose User model to check permissions against.
 * @param {Mongoose.Model} [PostcodeModel] - Optional mongoose Postcode model to check permissions against with can/cannot.
 * 
 * @returns A CASL ability object defining the user's permissions for the /postcodes route.
 */
function defineAbilitiesFor(user) {
  //console.log(`current user: ${user.username}\nrole: ${user.role.name}`)

  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // non authenticated users

  // authenticated users
  // standard users
  if (user.role.name === "user") {
    //console.log('standard user role')

    can("read", "Postcode")
  }

  // paid users
  if (user.role.name === "user") {
    //console.log('standard user role')

    can("read", "Postcode")
  }

  // admin users
  if (user.role.name === "admin") {
    //console.log('admin user role')

    can("readAll", "Postcode")
    can("read", "Postcode")
  }

  return build();
}

module.exports = defineAbilitiesFor;
