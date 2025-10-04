// schemas/postcodeSchema.ts
import { Type, type Static } from "@sinclair/typebox"
import { ErrorResponseSchema } from "./commonSchema.js"

// postcode query params
const PostcodeParamSchema = Type.Object({
    postcode: Type.String({
        description: "Postcode to search for",
        pattern: "^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$",
    }),
})

// Common postcode return structure
const GetPostcodeResponseSchema = Type.Object({
    // map things according to how they are returned in the final function
})

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
        401: ErrorResponseSchema, // Not logged in
        403: ErrorResponseSchema, // Not allowed to read postcode
        404: ErrorResponseSchema, // Postcode not found
    }),
})

// Types
export type PostcodeParams = Static<typeof PostcodeParamSchema>

export type GetAllPostcodesResponse = Static<typeof GetAllPostcodesSchema>
export type GetRandomPostcodeResponse = Static<typeof GetRandomPostcodeSchema>
export type GetPostcodeResponse = Static<typeof GetPostcodeResponseSchema>
