const { AbilityBuilder, createMongoAbility } = require("@casl/ability");

function defineAbilitiesFor(user) {
  //console.log(`current user: ${user.username}\nrole: ${user.role.name}`)

  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // non authenticated users
  can("create", "User"); // register

  // authenticated users
  // standard users
  if (user.role.name === "user") {
    //console.log('standard user role')

    can("read", "User", { _id: user._id }); // can read own details except for password/passwordSalt
    cannot("read", "AllUsers"); // cannot read other user's details
    cannot("read", "UserPassword");

    can("update", "User", { _id: user._id }); // only for the fields: ‘firstName’, ‘lastName’, ‘about’, ‘password’, ‘email’, ‘avatarURL’
    can("delete", "User", { _id: user._id });
  }

  // paid users ...

  // admin users
  if (user.role.name === "admin") {
    //console.log('admin user role')

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
