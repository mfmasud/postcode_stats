const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");

const logger = require("../utils/logger");

const auth = require("../controllers/auth");
const router = Router({ prefix: "/api/v1/users" });

const User = require("../models/User");
const Role = require("../models/Role");

const mongoose = require("mongoose");

const createAbilityFor = require("../permissions/users");

router.get("/", auth, getAllUsers); // only admins can get all users
router.post("/", bodyParser(), createUser); // anyone can create a user e.g. register

router.get("/:id([0-9]{1,})", auth, getUserById); // authenticated users can get user information, only non-sensitive information is returned
router.put("/:id([0-9]{1,})", auth, bodyParser(), updateUserById); // authenticated users can update some of their own user info, admins can update everything
// both roles are still subject to checks from the model e.g. invalid data.
router.del("/:id([0-9]{1,})", auth, deleteUserById); // admins can delete any standard user, standard users can delete their own account.

async function getAllUsers(cnx, next) {
  logger.info("getAllUsers() called");

  if (!cnx.state.user) {
    cnx.status = 401;
    logger.error("[401] User needs to log in.");
    cnx.body = { message: "You are not logged in." };
    return;
  }

  //logger.info(`User: ${cnx.state.user}`);
  const ability = createAbilityFor(cnx.state.user);
  const permission = ability.can("read", "AllUsers");
  //logger.info(`Permission: ${permission}`);

  if (!permission) {
    cnx.throw(403, "You are not allowed to perform this action");
  } else {
    const users = await User.find().populate("role");

    if (!users) {
      // technically this should never happen as we are literally signing in with a user
      cnx.status = 404;
      logger.error("[404] No users found in database.");
      cnx.body = { message: "No users found." };
    } else {
      cnx.body = users;
      cnx.status = 200;
      logger.info("[200] All users from database returned.");
    }
  }
}

async function createUser(cnx, next) {
  // users register with a username, password and email
  // they are assigned the role of "user" by default

  logger.info("createUser() called");

  const { username, password, email } = cnx.request.body;

  // check if email, password, or username are empty
  if (!username || !password || !email) {
    cnx.status = 400;
    logger.error("[400] Username, password or email field is empty.");
    cnx.body = { message: "Username, password or email field is empty." };
    return;
  }

  // check if username or email already exists
  const usernameCheck = await User.findOne({ username: username });
  const emailCheck = await User.findOne({ email: email });

  if (usernameCheck) {
    cnx.status = 400;
    logger.error("[400] Username already exists.");
    cnx.body = { message: "Username already exists." };
    return;
  } else if (emailCheck) {
    cnx.status = 400;
    logger.error("[400] Email already exists.");
    cnx.body = { message: "Email already exists." };
    return;
  }

  try {
    // create a new user
    const user = await User.create({
      username: username,
      password: password,
      email: email,
      role: await Role.findOne({ name: "user" }),
    });

    // return the username, email and role of the new user from the database
    const savedUser = user;
    cnx.status = 201;
    logger.info(`[201] User created: ${savedUser.username}`);
    cnx.body = {
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role.name,
    };
  } catch (error) {
    cnx.status = 400;
    logger.error(`[400] Error: User creation failed:\n${error}`);
    cnx.body = { message: "User creation failed." };
  }
}

async function getUserById(cnx, next) {
  logger.info("getUserById() called");
  const id = cnx.params.id;

  if (!cnx.state.user) {
    cnx.status = 401;
    logger.error("[401] User needs to log in.");
    cnx.body = { message: "You are not logged in." };
    return;
  }
  const user = cnx.state.user;

  logger.info(`Looking for User with ID: ${id}`);

  if (!(await isValidUserID(id))) {
    cnx.status = 400;
    logger.error("[400] Invalid user ID: " + id);
    cnx.body = { message: "Invalid user ID." };
    return;
  }
  const findUser = await User.findOne({ id: id }).populate("role");

  if (!findUser) {
    cnx.status = 404;
    logger.error(`[404] User not found, ID: ${id}`);
    cnx.body = { message: "User not found." };
    return;
  }

  const ability = createAbilityFor(user);

  if (!ability.can("read", findUser)) {
    cnx.status = 403;
    logger.error("[403] User is not allowed to perform this action.");
    cnx.body = { message: "You are not allowed to perform this action." };
    return;
  } else {
    cnx.status = 200;
    logger.info("[200] User found.");
    cnx.body = {
      id: findUser.id,
      firstName: findUser.firstName,
      lastName: findUser.lastName,
      about: findUser.about,
      username: findUser.username,
      email: findUser.email,
      avatarURL: findUser.avatarURL,
      role: findUser.role.name,
      dateRegistered: findUser.dateRegistered,
    };

    // if the user is allowed to read the password, return it
    if (ability.can("read", "UserPassword")) {
      cnx.body.password = findUser.password;
    }
  }
}

async function updateUserById(cnx, next) {
  logger.info("updateUserByID() called");

  let id = cnx.params.id;
  let { firstName, lastName, about, password, email, avatarURL } =
    cnx.request.body;

  const updateVars = [firstName, lastName, about, password, email, avatarURL]; // not used

  if (!cnx.state.user) {
    cnx.status = 401;
    logger.error("[401] User needs to log in.");
    cnx.body = { message: "You are not logged in." };
  }
  const user = cnx.state.user;

  const ValidUserID = await isValidUserID(id);
  if (!ValidUserID) {
    cnx.status = 400;
    logger.error(`[400] Invalid User ID: ${id}`);
    cnx.body = { message: "Invalid user ID." };
    return;
  }

  const updateUser = await User.findOne({ id: id });

  const ability = createAbilityFor(user);

  if (!ability.can("update", updateUser)) {
    cnx.status = 403;
    logger.error(
      `[403] User ${user.username} is not allowed to update user with ID: ${id}`
    );
    cnx.body = { message: "You are not allowed to update this user." };
    return;
  } else {
    try {
      // I tried to use forEach and updateVars but couldn't figure out how to use it with the database e.g. await db.element = element (??)
      // The result is this beautiful sequence of if statements, which can show in the console which fields were updated

      if (firstName) {
        updateUser.firstName = firstName;
      }

      if (lastName) {
        updateUser.lastName = lastName;
      }

      if (about) {
        updateUser.about = about;
      }

      if (password) {
        updateUser.password = password;
      }

      if (email) {
        updateUser.email = email;
      }

      if (avatarURL) {
        updateUser.avatarURL = avatarURL;
      }

      await updateUser.save();

      cnx.status = 200;
      logger.info(`[200] User with ID ${id} updated successfully`);
      changes = ""; // would show the fields that have changes in them
      cnx.body = {
        message: `Edited fields for user with ID: ${id}`,
      }; // fields would be replaced with the changes string
    } catch (error) {
      cnx.status = 400;
      logger.error(`[400] Error: User update failed with error:\n${error}`);
      cnx.body = { message: "User update failed." };
    }
  }
}

async function deleteUserById(cnx, next) {
  logger.info("deleteUserById() called");
  const id = cnx.params.id;

  if (!cnx.state.user) {
    cnx.status = 401;
    logger.error("[401] User needs to log in.");
    cnx.body = { message: "You are not logged in." };
    return;
  }
  const user = cnx.state.user;

  logger.info(`Looking for User with ID: ${id}`);

  if (!(await isValidUserID(id))) {
    cnx.status = 400;
    logger.error(`[400] Invalid user ID: ${id}`);
    cnx.body = { message: "Invalid user ID." };
    return;
  }

  const deleteUser = await User.findOne({ id: id });

  const ability = createAbilityFor(user);

  if (!ability.can("delete", deleteUser)) {
    cnx.status = 403;
    logger.error("[403] User is not allowed to delete this user.");
    cnx.body = { message: "You are not allowed to delete this user." };
    return;
  } else {
    try {
      await User.deleteOne({ id: id });
      cnx.status = 200;
      logger.info(`[200] User with ID ${id} deleted successfully`);

      cnx.body = {
        message: "User deleted.",
      };
    } catch (error) {
      cnx.status = 400;
      logger.error(`[400] Error: User deletion failed:\n${error}`);
      cnx.body = { message: "User deletion failed." };
    }
  }
}

async function isValidUserID(id) {
  const UserID = await User.findOne({ id: id });

  if (UserID) {
    return true;
  } else {
    return false;
  }
}

module.exports = router;
