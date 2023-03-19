const { AbilityBuilder, createMongoAbility } = require("@casl/ability");

function defineAbilitiesFor(user) {
  //console.log(`current user: ${user.username}\nrole: ${user.role.name}`)

  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // non authenticated users
  can("read", "Listing")

  // authenticated users
  // standard users
  if (user.role.name === "user") {
    //console.log('standard user role')
  }

  // paid users
  if (user.role.name === "paiduser") {
    //console.log('paid user role')
  }

  // admin users
  if (user.role.name === "admin") {
    //console.log('admin user role')
    
    can("create", "Listing");
    can("update", "Listing");
    can("delete", "Listing");
  }

  return build();
}

module.exports = defineAbilitiesFor;
