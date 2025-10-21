// schemas/searchSchema.ts
import { Type, type Static } from "@sinclair/typebox"
import { ErrorResponseSchema } from "./commonSchema.js"
import { PostcodeResponseSchema } from "./postcodeSchema.js"
import { BusStopResponseSchema } from "./busStopSchema.js"
import { CrimeResponseSchema } from "./crimeSchema.js"

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

// HATEOAS link structure
const LinkSchema = Type.Object({
    href: Type.String({
        description: "URL of the linked resource",
    }),
})

// Links object for HATEOAS compliance
const LinksSchema = Type.Object({
    self: Type.Optional(LinkSchema),
    postcode: Type.Optional(LinkSchema),
    alternate: Type.Optional(LinkSchema),
})

// Common search response structure
// Based on the Search Mongoose model with populated references
// @see {@link module:models/Search}
export const SearchResponseSchema = Type.Object({
    _id: Type.String({
        description: "MongoDB ObjectId of the search record",
    }),
    searchID: Type.Number({
        description: "Unique sequential search identifier",
    }),
    latitude: Type.Number({
        description: "Latitude coordinate in WGS84 format",
    }),
    longitude: Type.Number({
        description: "Longitude coordinate in WGS84 format",
    }),
    Northing: Type.String({
        description: "British National Grid Northing coordinate",
    }),
    Easting: Type.String({
        description: "British National Grid Easting coordinate",
    }),
    reverseLookup: Type.Boolean({
        description: "Whether this search was performed via reverse geocoding",
    }),
    Postcode: PostcodeResponseSchema,
    queryBusStops: Type.Array(BusStopResponseSchema, {
        description: "Array of nearby bus stops (up to 5)",
    }),
    queryCrimes: Type.Array(CrimeResponseSchema, {
        description: "Array of crimes in the area",
    }),
    linkedATCO: Type.Optional(
        Type.String({
            description:
                "MongoDB ObjectId reference to the linked ATCO code (not populated)",
        })
    ),
    linkedCrimeList: Type.Optional(
        Type.String({
            description:
                "MongoDB ObjectId reference to the linked CrimeList (not populated)",
        })
    ),
    _links: Type.Optional(LinksSchema),
    __v: Type.Optional(
        Type.Number({
            description: "Mongoose version key",
        })
    ),
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
