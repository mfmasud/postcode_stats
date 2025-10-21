// schemas/searchSchema.ts
import { Type, type Static } from "@sinclair/typebox"
import { ErrorResponseSchema } from "./commonSchema.js"

// Query parameters for GET /api/v2/search/ (searchArea)
export const SearchAreaQuerySchema = Type.Object({
    latitude: Type.Number({
        description: "Latitude coordinate in WGS84 format",
        minimum: -90,
        maximum: 90,
    }),
    longitude: Type.Number({
        description: "Longitude coordinate in WGS84 format",
        minimum: -180,
        maximum: 180,
    }),
})

// Body for POST /api/v2/search/ (searchPostcode)
export const SearchPostcodeBodySchema = Type.Object({
    postcode: Type.String({
        description: "UK postcode to search for",
        pattern: "^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$",
    }),
})

// Common search response structure
const SearchResponseSchema = Type.Object({
    // Define the search response structure based on Search model
    // This will be populated by the handlers
})

// GET /api/v2/search/ (searchArea) schema
export const SearchAreaRouteSchema = Type.Object({
    querystring: SearchAreaQuerySchema,
    response: Type.Object({
        200: SearchResponseSchema,
        400: ErrorResponseSchema, // Invalid lat/long
        403: ErrorResponseSchema, // No permission to search
        404: ErrorResponseSchema, // No postcode found for coordinates
    }),
})

// POST /api/v2/search/ (searchPostcode) schema
export const SearchPostcodeRouteSchema = Type.Object({
    body: SearchPostcodeBodySchema,
    response: Type.Object({
        200: SearchResponseSchema,
        400: ErrorResponseSchema, // Invalid or missing postcode
        403: ErrorResponseSchema, // No permission to search
        404: ErrorResponseSchema, // Postcode data not available
    }),
})

// GET /api/v2/search/random (searchRandom) schema
export const SearchRandomRouteSchema = Type.Object({
    response: Type.Object({
        200: SearchResponseSchema,
        401: ErrorResponseSchema, // User not authenticated
        403: ErrorResponseSchema, // No permission to create random search
        500: ErrorResponseSchema, // Unable to generate random postcode
    }),
})

// Types
export type SearchAreaQuery = Static<typeof SearchAreaQuerySchema>
export type SearchPostcodeBody = Static<typeof SearchPostcodeBodySchema>
export type SearchResponse = Static<typeof SearchResponseSchema>

export type SearchAreaParams = SearchAreaQuery
export type SearchPostcodeParams = SearchPostcodeBody
