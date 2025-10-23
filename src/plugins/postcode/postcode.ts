/**
 * @file This file contains the routes for the postcode section of the API.
 * @module src/plugins/postcode/postcode.ts
 * @author Mohammed Fardhin Masud <fardhinmasud@gmail.com>
 *
 * @requires utils/logger
 * @requires models/Postcode
 * @requires permissions/postcodes
 *
 * @exports postcodeRoutes
 */

import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox"
import {
    GetPostcodeRouteSchema,
    ValidatePostcodeResponseSchema,
} from "../../schemas/postcodeSchema.js"

import {
    getAllPostcodes,
    getRandomPostcodeRoute,
    getPostcodeRoute,
    validatePostcodeRoute,
} from "./postcodeHelper.js"

const postcodeRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get(
        "/postcodes",
        { preHandler: [fastify.authenticate] },
        getAllPostcodes
    ) // only admins can view all postcodes
    fastify.get(
        "/postcodes/random",
        { preHandler: [fastify.authenticate] },
        getRandomPostcodeRoute
    ) // authenticated users can retrieve a random postcode
    fastify.get(
        "/postcodes/:postcode",
        { schema: GetPostcodeRouteSchema },
        getPostcodeRoute
    ) // anyone can search for a specific postcode
    fastify.post(
        "/postcodes/validate",
        { schema: ValidatePostcodeResponseSchema },
        validatePostcodeRoute
    ) // anyone can validate a specific postcode
}

export default postcodeRoutes
