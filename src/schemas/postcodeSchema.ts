// schemas/postcodeSchema.ts
import { Type, type Static } from "@sinclair/typebox"
import { ErrorResponseSchema } from "./commonSchema.js"

// postcode query params
export const PostcodeParamSchema = Type.Object({
    postcode: Type.String({
        description: "Postcode to search for",
        pattern: "^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$",
    }),
})

// Common postcode return structure
// Based on the Postcode Mongoose model
// @see {@link module:models/Postcode}
export const PostcodeResponseSchema = Type.Object({
    _id: Type.String({
        description: "MongoDB ObjectId of the postcode",
    }),
    postcode: Type.String({
        description: "UK postcode in normalized format",
    }),
    eastings: Type.Optional(
        Type.Number({
            description: "Ordnance Survey Easting coordinate",
        })
    ),
    northings: Type.Optional(
        Type.Number({
            description: "Ordnance Survey Northing coordinate",
        })
    ),
    country: Type.String({
        description:
            "Country name (England, Scotland, Wales, Northern Ireland)",
    }),
    longitude: Type.Number({
        description: "Longitude coordinate in WGS84 format",
    }),
    latitude: Type.Number({
        description: "Latitude coordinate in WGS84 format",
    }),
    region: Type.Optional(
        Type.String({
            description: "Region name",
        })
    ),
    parliamentary_constituency: Type.Optional(
        Type.String({
            description: "Parliamentary constituency name",
        })
    ),
    admin_district: Type.Optional(
        Type.String({
            description: "Administrative district name",
        })
    ),
    admin_ward: Type.Optional(
        Type.String({
            description: "Administrative ward name",
        })
    ),
    parish: Type.Optional(
        Type.String({
            description: "Parish name",
        })
    ),
    admin_county: Type.Union([Type.String(), Type.Null()], {
        description: "Administrative county name (can be null)",
    }),
    __v: Type.Optional(
        Type.Number({
            description: "Mongoose version key",
        })
    ),
})

const GetPostcodeResponseSchema = PostcodeResponseSchema

// GET /postcode (getAllPostcodes) schema
export const GetAllPostcodesSchema = Type.Object({
    response: Type.Object({
        200: Type.Array(GetPostcodeResponseSchema),
        400: ErrorResponseSchema, // Invalid request
        401: ErrorResponseSchema, // User not authenticated
        403: ErrorResponseSchema, // No permission to retrieve all postcodes
        404: ErrorResponseSchema, // No postcode found
    }),
})

// GET /postceodes/random
export const GetRandomPostcodeSchema = Type.Object({
    response: Type.Object({
        200: GetPostcodeResponseSchema,
        400: ErrorResponseSchema, // Invalid request
        401: ErrorResponseSchema, // User not authenticated
        403: ErrorResponseSchema, // No permission to retrieve random postcode
    }),
})

// GET /postcodes/:postcode (getPostcodeRoute) schema
export const GetPostcodeRouteSchema = Type.Object({
    params: PostcodeParamSchema,
    response: Type.Object({
        200: GetPostcodeResponseSchema,
        400: ErrorResponseSchema, // Invalid postcode
        //401: ErrorResponseSchema, // Not logged in
        //403: ErrorResponseSchema, // Not allowed to read postcode
        404: ErrorResponseSchema, // Postcode not found
    }),
})

export const ValidatePostcodeBodySchema = Type.Object({
    postcode: Type.String({
        description: "UK postcode to validate",
    }),
})

// POST /postcodes/validate
export const ValidatePostcodeResponseSchema = Type.Object({
    body: ValidatePostcodeBodySchema,
    response: Type.Object({
        200: Type.Boolean({
            description: "Whether the postcode is valid",
        }),
        400: ErrorResponseSchema, // Invalid or no postcode
    }),
})

// Types
export type PostcodeParams = Static<typeof PostcodeParamSchema>
export type PostcodeResponse = Static<typeof PostcodeResponseSchema>
export type ValidatePostcodeBody = Static<typeof ValidatePostcodeBodySchema>

export type GetAllPostcodesResponse = Static<typeof GetAllPostcodesSchema>
export type GetRandomPostcodeResponse = Static<typeof GetRandomPostcodeSchema>
export type GetPostcodeResponse = Static<typeof GetPostcodeResponseSchema>
export type ValidatePostcodeResponse = Static<
    typeof ValidatePostcodeResponseSchema
>
