const { AbilityBuilder, createMongoAbility } = require("@casl/ability");

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
