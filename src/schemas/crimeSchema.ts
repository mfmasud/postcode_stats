// schemas/crimeSchema.ts
import { Type, type Static } from "@sinclair/typebox"

/**
 * TypeBox schema for Crime model response
 * Based on the Crime Mongoose model
 * @see {@link module:models/Crime}
 */
export const CrimeResponseSchema = Type.Object({
    _id: Type.String({
        description: "MongoDB ObjectId of the crime record",
    }),
    crimeID: Type.Optional(
        Type.Number({
            description: "Unique crime identifier",
        })
    ),
    latitude: Type.Number({
        description: "Latitude coordinate of the crime location",
    }),
    longitude: Type.Number({
        description: "Longitude coordinate of the crime location",
    }),
    crime_category: Type.Optional(
        Type.String({
            description: "Category of the crime (e.g., anti-social-behaviour)",
        })
    ),
    crime_date: Type.Optional(
        Type.String({
            description: "Date of the crime in YYYY-MM format",
        })
    ),
    outcome_category: Type.Optional(
        Type.String({
            description: "Outcome category of the crime",
        })
    ),
    outcome_date: Type.Optional(
        Type.String({
            description: "Date of the crime outcome",
        })
    ),
    __v: Type.Optional(
        Type.Number({
            description: "Mongoose version key",
        })
    ),
})

export type CrimeResponse = Static<typeof CrimeResponseSchema>
