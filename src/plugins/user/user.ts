/**
 * @file This file contains the routes for the users API.
 * @module src/plugins/users/users.ts
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires utils/logger
 * @requires models/User
 * @requires models/Role
 * @requires permissions/users
 *
 * @exports userRoutes
 */

import type { FastifyInstance } from "fastify";
import { GetAllUsersSchema, CreateUserSchema, GetUserByIdSchema, UpdateUserByIdSchema, DeleteUserByIdSchema } from "../../schemas/userSchema.js";

import { getAllUsers, createUser, getUserById, updateUserById, deleteUserById } from "./userhelper.js";



async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [fastify.authenticate], schema: GetAllUsersSchema }, getAllUsers); // only admins can get all users
  fastify.post("/", { schema: CreateUserSchema }, createUser); // anyone can create a user e.g. register

  fastify.get("/:id([0-9]{1,})", { preHandler: [fastify.authenticate], schema: GetUserByIdSchema }, getUserById); // authenticated users can get user information, only non-sensitive information is returned
  fastify.put("/:id([0-9]{1,})", { preHandler: [fastify.authenticate], schema: UpdateUserByIdSchema }, updateUserById); // authenticated users can update some of their own user info, admins can update everything
  
  // both roles are still subject to checks from the model e.g. invalid data.
  fastify.delete("/:id([0-9]{1,})", { preHandler: [fastify.authenticate], schema: DeleteUserByIdSchema }, deleteUserById); // admins can delete any standard user, standard users can delete their own account.

}

export default userRoutes;