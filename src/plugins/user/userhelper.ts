import type { FastifyReply, FastifyRequest } from "fastify";
import type { Static } from "@sinclair/typebox";

import logger from "../../utils/logger.js";

import User from "../../models/User.js";
import Role from "../../models/Role.js";
import type { UserDoc, UserDocWithRole, AuthUser, UserInferredSchema } from "../../models/User.js";
import type { RoleDoc } from "../../models/Role.js";

import { 
  UserIdParamSchema,
  CreateUserSchema, 
  UpdateUserByIdSchema,
  type CreateUserBody,
  type UpdateUserBody
} from "../../schemas/userSchema.js";

// Extract the param types
type UserIdParams = Static<typeof UserIdParamSchema>;

import createAbilityFor from "../../permissions/users.js";

/**
 * Retrieves all users from the database and returns them in the response body.
 * Verifies that the user is logged in and has permission to view all users using the permissions/users.js file.
 *
 * @async
 * @function getAllUsers
 *
 * @param {FastifyRequest} request - The Fastify request object containing user.authuser which contains the user object.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @throws {Error} Throws an error with status code 401 if the user is not logged in.
 * @throws {Error} Throws an error with status code 403 if the user does not have permission to view all users.
 * @throws {Error} Throws an error with status code 404 if no users are found in the database.
 * @returns {Promise} An empty Promise that resolves once the response has been sent.
 *
 * @see {@link module:controllers/auth} for the auth middleware which verifies that the user is logged in.
 * @see {@link module:permissions/users} for the permissions file which verifies that the user has permission to view
 * this resource.
 */
async function getAllUsers(request: FastifyRequest, reply: FastifyReply) {
  logger.info("getAllUsers() called");

  if (!request.authUser) {
    logger.error("[401] User needs to log in.");
    reply.status(401).send({ error: "Unauthorized", message: "You are not logged in." });
    return;
  }

  const userID = request.authUser.id;
  if (userID == null) {
    logger.error("[401] Authenticated user missing id.");
    reply.status(401).send({ error: "Unauthorized", message: "You are not logged in." });
    return;
  }

  const dbUser = await User.findOne({ id: userID }).populate<{ role: RoleDoc }>("role");

  if (!dbUser) {
    logger.error("[401] Authenticated user not found or role not available.");
    reply.status(401).send({ error: "Unauthorized", message: "You are not logged in." });
    return;
  }

  const ability = createAbilityFor(dbUser as UserDocWithRole);
  const permission = ability.can("read", "AllUsers");

  if (!permission) {
    logger.error("[403] User does not have permission to view all users.");
    reply.status(403).send({ error: "Forbidden", message: "You are not allowed to perform this action." });
  } else {
    const users = await User.find().populate("role");

    if (!users) {
      // technically this should never happen as we are literally signing in with a user
      logger.error("[404] No users found in database.");
      reply.status(404).send({ error: "Not Found", message: "No users found in database." });
    } else {
      reply.status(200).send(users);
      logger.info("[200] All users from database returned.");
    }
  }
}

/**
 * Creates a new user in the database and returns the username, email and role of the new user in the response body.
 *
 * @async
 * @function createUser
 *
 * @param {FastifyRequest} request - The Fastify request object containing the request information.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @throws {Error} Throws an error with status code 400 if the username, password or email field is empty.
 * @throws {Error} Throws an error with status code 400 if the username or email already exists.
 * @throws {Error} Throws an error with status code 500 if the user could not be created.
 * @returns {Promise} An empty Promise that resolves once the response has been sent.
 *
 * @see {@link module:models/User} for the User model.
 * @see {@link module:models/Role} for the Role model.
 *
 */
async function createUser(request: FastifyRequest, reply: FastifyReply) {
  // users register with a username, password and email
  // they are assigned the role of "user" by defaultt

  logger.info("createUser() called");
  const { username, password, email } = request.body as CreateUserBody;

  // check if email, password, or username are empty
  if (!username || !password || !email) {
    logger.error("[400] Username, password or email field is empty.");
    reply.status(400).send({ error: "Bad Request", message: "Username, password or email field is empty." });
    return;
  }

  // check if username or email already exists
  const usernameCheck = await User.exists({ username: username });
  const emailCheck = await User.exists({ email: email });

  if (usernameCheck) {
    logger.error("[400] Username already exists.");
    reply.status(400).send({ error: "Bad Request", message: "Username already exists." });
    return;
  } else if (emailCheck) {
    logger.error("[400] Email already exists.");
    reply.status(400).send({ error: "Bad Request", message: "Email already exists." });
    return;
  }

  const roleDoc : RoleDoc | null = await Role.findOne({ name: "user" });

  if (!roleDoc) {
    reply.status(400).send({ error: "Bad Request", message: "Role not found" });
    return;
  }

  try {
    // create a new user
    const newUser: UserDoc = await User.create({
      username: username,
      password: password,
      email: email,
      role: roleDoc._id,
    });

    // return the username, email and role of the new user from the database
    const savedUser = await newUser.populate<{ role: RoleDoc }>('role');
    logger.info(`[201] User created: ${savedUser.username}`);
    reply.status(201).send({
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role.name,
    });
  } catch (error) {
    logger.error(`[500] Error: User creation failed:\n${error}`);
    reply.status(500).send({ error: "Internal Server Error", message: "User creation failed." });
  }
}

/**
 * Retrieves a user from the database and returns various information about the user in the response body.
 * If the user has access to view the password of the user, the (hashed and salted) password is also returned in the
 * response body.
 *
 * @async
 * @function getUserById
 *
 * @param {FastifyRequest} request - The Fastify request object containing the request information.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @throws {Error} Throws an error with status code 401 if the user is not logged in.
 * @throws {Error} Throws an error with status code 400 if the user ID entered is invalid.
 * @throws {Error} Throws an error with status code 404 if the user is not found in the database.
 * @returns {Promise} An empty Promise that resolves once the response has been sent.
 *
 */
async function getUserById(request: FastifyRequest, reply: FastifyReply) {
  logger.info("getUserById() called");
  const { id } = request.params as UserIdParams;

  if (!request.authUser) {
    logger.error("[401] User needs to log in.");
    reply.status(401).send({ error: "Unauthorized", message: "You are not logged in." });
    return;
  }

  const userID = request.authUser.id;
  if (userID == null) {
    logger.error("[401] Authenticated user missing id.");
    reply.status(401).send({ error: "Unauthorized", message: "You are not logged in." });
    return;
  }

  const dbUser = await User.findOne({ id: userID }).populate<{ role: RoleDoc }>("role");

  if (!dbUser) {
    logger.error("[401] Authenticated user not found or role not available.");
    reply.status(401).send({ error: "Unauthorized", message: "You are not logged in." });
    return;
  }

  logger.info(`Looking for User with ID: ${id}`);

  if (!(await isValidUserID(id))) {
    logger.error("[400] Invalid user ID: " + id);
    reply.status(400).send({ error: "Bad Request", message: "Invalid user ID." });
    return;
  }
  const findUser = await User.findOne({ id: id }).populate<{ role: RoleDoc }>("role");

  if (!findUser) {
    logger.error(`[404] User not found, ID: ${id}`);
    reply.status(404).send({ error: "Not Found", message: "User not found." });
    return;
  }

  const ability = createAbilityFor(dbUser as UserDocWithRole);
  interface ReturnData {
    id: string;
    firstName: string;
    lastName: string;
    about: string;
    username: string;
    email: string;
    role: string;
    dateRegistered: Date;
    password?: string;
  }

  let returnData: ReturnData = {} as ReturnData;
  if (!ability.can("read", findUser)) {
    logger.error("[403] User is not allowed to perform this action.");
    reply.status(403).send({ error: "Forbidden", message: "You are not allowed to perform this action." });
    return;
  } else {
    logger.info("[200] User found.");
    returnData = {
      id: findUser.id,
      firstName: findUser.firstName ?? "",
      lastName: findUser.lastName ?? "",
      about: findUser.about ?? "",
      username: findUser.username,
      email: findUser.email,
      role: findUser.role.name,
      dateRegistered: findUser.dateRegistered,
    };

    // if the user is allowed to read the password, return it
    if (ability.can("read", "UserPassword")) {
      returnData.password = findUser.password;
    }

    reply.status(200).send(returnData);
  }
}

/**
 * Updates a user in the database and returns a message showing the fields which were edited.
 *
 * @async
 * @function updateUserById
 *
 * @param {FastifyRequest} request - The Fastify request object containing the request information.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @throws {Error} Throws an error with status code 401 if the user is not logged in.
 * @throws {Error} Throws an error with status code 400 if the user ID entered is invalid.
 * @throws {Error} Throws an error with status code 403 if the user is not allowed to perform this action.
 * @throws {Error} Throws an error with status code 500 if the user could not be updated or there was an error.
 * @returns {Promise} An empty Promise that resolves once the response has been sent.
 *
 * @see isValidUserID
 */
async function updateUserById(request: FastifyRequest, reply: FastifyReply) {
  logger.info("updateUserByID() called");

  const { id } = request.params as UserIdParams;
  const { firstName, lastName, about, password, email } =
    request.body as UpdateUserBody;

  //const updateVars = [firstName, lastName, about, password, email]; // not used

  if (!request.authUser) {
    logger.error("[401] User needs to log in.");
    reply.status(401).send({ error: "Unauthorized", message: "You are not logged in." });
    return;
  }
  const user = request.authUser;

  const ValidUserID = await isValidUserID(id);
  if (!ValidUserID) {
    logger.error(`[400] Invalid User ID: ${id}`);
    reply.status(400).send({ error: "Bad Request", message: "Invalid User ID." });
    return;
  }

  const updateUser = await User.findOne({ id: id });

  if (!updateUser) {
    logger.error(`[404] User not found, ID: ${id}`);
    reply.status(404).send({ error: "Not Found", message: "User not found." });
    return;
  }

  const userID = request.authUser.id;
  if (userID == null) {
    logger.error("[401] Authenticated user missing id.");
    reply.status(401).send({ error: "Unauthorized", message: "You are not logged in." });
    return;
  }

  const dbUser = await User.findOne({ id: userID }).populate<{ role: RoleDoc }>("role");

  if (!dbUser) {
    logger.error("[401] Authenticated user not found or role not available.");
    reply.status(401).send({ error: "Unauthorized", message: "You are not logged in." });
    return;
  }

  const ability = createAbilityFor(dbUser as UserDocWithRole);

  if (!ability.can("update", updateUser)) {
    logger.error(
      `[403] User ${user.username} is not allowed to update user with ID: ${id}`
    );
    reply.status(403).send({ error: "Forbidden", message: "You are not allowed to perform this action." });
    return;
  } else {
    try {
      // I tried to use forEach and updateVars but couldn't figure out how to use it with the database e.g. await db.element =
      // element (??)
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

      await updateUser.save();

      logger.info(`[200] User with ID ${id} updated successfully`);
      const changes = ""; // would show the fields that have changes in them
      reply.status(200).send({ message: `Edited fields for user with ID: ${id}` }); // fields would be replaced with the
      // changes string
    } catch (error) {
      logger.error(`[500] Error: User update failed with error:\n${error}`);
      reply.status(500).send({ error: "Internal Server Error", message: "User update failed." });
    }
  }
}

/**
 * Deletes a user from the database and returns a message indicating this in the response body.
 *
 * @async
 * @function deleteUserById
 *
 * @param {FastifyRequest} request - The Fastify request object containing the request information.
 * @param {FastifyReply} reply - The Fastify reply object.
 * @throws {Error} Throws an error with status code 401 if the user is not logged in.
 * @throws {Error} Throws an error with status code 400 if the user ID entered is invalid.
 * @throws {Error} Throws an error with status code 403 if the user is not allowed to perform this action.
 * @throws {Error} Throws an error with status code 500 if the user cannot be deleted or an error occurs.
 * @returns {Promise} An empty Promise that resolves once the response has been sent.
 *
 * @see {@link isValidUserID} for more information on the isValidUserID function.
 *
 */
async function deleteUserById(request: FastifyRequest, reply: FastifyReply) {
  logger.info("deleteUserById() called");
  const { id } = request.params as UserIdParams;

  if (!request.authUser) {
    logger.error("[401] User needs to log in.");
    reply.status(401).send({ error: "Unauthorized", message: "You are not logged in." });
    return;
  }

  const userID = request.authUser.id;
  if (userID == null) {
    logger.error("[401] Authenticated user missing id.");
    reply.status(401).send({ error: "Unauthorized", message: "You are not logged in." });
    return;
  }

  const dbUser = await User.findOne({ id: userID }).populate<{ role: RoleDoc }>("role");

  if (!dbUser) {
    logger.error("[401] Authenticated user not found or role not available.");
    reply.status(401).send({ error: "Unauthorized", message: "You are not logged in." });
    return;
  }

  logger.info(`Looking for User with ID: ${id}`);

  if (!(await isValidUserID(id))) {
    logger.error(`[400] Invalid user ID: ${id}`);
    reply.status(400).send({ error: "Bad Request", message: "Invalid user ID." });
    return;
  }

  const deleteUser = await User.findOne({ id: id });

  if (!deleteUser) {
    logger.error(`[404] User not found, ID: ${id}`);
    reply.status(404).send({ error: "Not Found", message: "User not found." });
    return;
  }

  const ability = createAbilityFor(dbUser as UserDocWithRole);

  if (!ability.can("delete", deleteUser)) {
    logger.error("[403] User is not allowed to delete this user.");
    reply.status(403).send({ error: "Forbidden", message: "You are not allowed to perform this action." });
    return;
  } else {
    try {
      await User.deleteOne({ id: id });
      logger.info(`[200] User with ID ${id} deleted successfully`);
      reply.status(200).send({ message: "User deleted." });
    } catch (error) {
      logger.error(`[500] Error: User deletion failed:\n${error}`);
      reply.status(500).send({ error: "Internal Server Error", message: "User deletion failed." });
    }
  }
}

/**
 * Checks if a user ID is valid.
 *
 * @async
 * @function isValidUserID
 *
 * @param {String} id - The user ID to check.
 * @returns {Boolean} Returns true if the provided user ID is valid, false otherwise.
 *
 */
async function isValidUserID(id: string): Promise<boolean> {
  const UserID = await User.exists({ id: id });

  if (UserID) {
    return true;
  } else {
    return false;
  }
}

export { getAllUsers, createUser, getUserById, updateUserById, deleteUserById, isValidUserID };