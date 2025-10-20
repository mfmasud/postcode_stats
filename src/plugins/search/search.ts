/**
 * @file Contains the main search routes for the API, allowing users to search for a postcode/lat-long pair and get related stops and crimes.
 * @module plugins/search/newsearch
 * @author Mohammed Fardhin Masud <fardhinmasud@gmail.com>
 *
 * @requires fastify
 * @requires @fastify/type-provider-typebox
 * @requires schemas/searchSchema
 * @requires searchRouteFunctions
 *
 * @exports searchRoutes
 */

import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox"
import {
    SearchAreaRouteSchema,
    SearchPostcodeRouteSchema,
    SearchRandomRouteSchema,
} from "../../schemas/searchSchema.js"

import {
    searchArea,
    searchPostcode,
    searchRandom,
} from "./searchRouteFunctions.js"

const searchRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get("/search", { schema: SearchAreaRouteSchema }, searchArea) // GET - finds a postcode internally using latitude and longitude from the query parameters

    fastify.post(
        "/search",
        { schema: SearchPostcodeRouteSchema },
        searchPostcode
    ) // POST - verifies and searches using postcode from the request body

    fastify.get(
        "/search/random",
        {
            preHandler: [fastify.authenticate],
            schema: SearchRandomRouteSchema,
        },
        searchRandom
    ) // authenticated users only - for testing
}

export default searchRoutes
