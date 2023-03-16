const BasicStrategy = require("passport-http").BasicStrategy;
const bcrypt = require("bcrypt");

const User = require("../models/User");

async function verifyPassword(userobj, password) {
  //console.log("verifyPassword called");
  //console.log(`userobj.password: ${userobj.password}`);
  //console.log(userobj.password === password);
  
  const match = await bcrypt.compare(password, userobj.password);
  //console.log(`password matched? ${match}`);
  //console.log(`PW:${password}\nHASH:${userobj.password}\n`);
  return match;

}

const checkUserAndPass = async (username, password, done) => {
  console.log("Authenticating user \"" + username + "\"");
  //console.log(`password: ${password}`)

  // look up the user and check the password if the user exists
  // call done() with either an error or the user, depending on outcome

  if (!username || !password) {
    console.log("No username or password provided");
    return done(null, false);
  } else {
    if (!username) {
      console.log("No username provided"); // not sure how to trigger this one
      return done(null, false);
    }
    if (!password) {
      console.log("No password provided");
      return done(null, false);
    }
  }

  try {

    const user = await User.findByUsername(username);

    if (!user) { // no user found in database
      console.log(`No user found with username ${username}`);
    } else { // user found in database
      console.log(`Found user ${username}`);
      if (await verifyPassword(user, password)) { // password correct
        console.log(`Successfully authenticated user ${username}`);
        return done(null, user);
      } else {
        console.log(`Password incorrect for user ${username}`);
      }
    }
  } catch (error) {
    console.error(`Error during authentication for user ${username}`);
    return done(error);
  }
  return done(null, false); // username or password were incorrect
};

const strategy = new BasicStrategy(checkUserAndPass);
module.exports = strategy;
