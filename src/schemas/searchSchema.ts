// schemas/searchSchema.ts
import { Type, type Static } from "@sinclair/typebox"
import { ErrorResponseSchema } from "./commonSchema.js"

import { type PostcodeParamSchema } from "./postcodeSchema.js"

export type SearchPostcodeParams = typeof PostcodeParamSchema

// GET /api/v1/search/
// POST /api/v1/search/
// GET /api/v1/search/random

const SearchAreaParams = Type.Object({
    latitude: Type.Number(),
    longitude: Type.Number(),
})

export type SearchAreaParams = typeof SearchAreaParams
