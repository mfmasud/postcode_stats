/**
 * @file Defines the CASL ability for users accessing the /postcodes route.
 * @module permissions/postcodes
 * @author Mohammed Fardhin Masud <fardhinmasud@gmail.com>
 *
 * @requires @casl/ability
 * @requires utils/logger
 *
 * @exports defineAbilitiesFor
 */

import { AbilityBuilder, createMongoAbility } from "@casl/ability"

//import logger from "../utils/logger.js";

import type { UserDocWithRole } from "../models/User.js"

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
function defineAbilitiesFor(user: UserDocWithRole) {
    //logger.info(`current user: ${user.username}\nrole: ${user.role.name}`)

    const { can, build } = new AbilityBuilder(createMongoAbility)

    // non authenticated users
    if (user.role.name === "none") {
        can("read", "Postcode")
    }

    // authenticated users
    // standard users
    if (user.role.name === "user") {
        can("read", "Postcode")
    }

    // paid users
    if (user.role.name === "paiduser") {
        can("read", "Postcode")
    }

    // admin users
    if (user.role.name === "admin") {
        can("readAll", "Postcode")
        can("read", "Postcode")
    }

    return build()
}

export default defineAbilitiesFor
