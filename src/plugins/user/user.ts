/**
 * @file This file contains the routes for the users API.
 * @module src/plugins/users/users.ts
 * @author Mohammed Fardhin Masud <fardhinmasud@gmail.com>
 *
 * @requires utils/logger
 * @requires models/User
 * @requires models/Role
 * @requires permissions/users
 *
 * @exports userRoutes
 */

import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox"
import {
    GetAllUsersSchema,
    CreateUserSchema,
    GetUserByIdSchema,
    UpdateUserByIdSchema,
    DeleteUserByIdSchema,
} from "../../schemas/userSchema.js"

import {
    getAllUsers,
    createUser,
    getUserById,
    updateUserById,
    deleteUserById,
} from "./userhelper.js"

const userRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get(
        "/users",
        { preHandler: [fastify.authenticate], schema: GetAllUsersSchema },
        getAllUsers
    ) // only admins can get all users
    fastify.post("/users", { schema: CreateUserSchema }, createUser) // anyone can create a user e.g. register

    fastify.get(
        "/users/:id([0-9]{1,})",
        { preHandler: [fastify.authenticate], schema: GetUserByIdSchema },
        getUserById
    ) // authenticated users can get user information, only non-sensitive information is returned
    fastify.put(
        "/users/:id([0-9]{1,})",
        { preHandler: [fastify.authenticate], schema: UpdateUserByIdSchema },
        updateUserById
    ) // authenticated users can update some of their own user info, admins can update everything

    // both roles are still subject to checks from the model e.g. invalid data.
    fastify.delete(
        "/users/:id([0-9]{1,})",
        { preHandler: [fastify.authenticate], schema: DeleteUserByIdSchema },
        deleteUserById
    ) // admins can delete any standard user, standard users can delete their own account.
}

export default userRoutes
