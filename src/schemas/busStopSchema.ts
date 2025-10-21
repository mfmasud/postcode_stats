// schemas/busStopSchema.ts
import { Type, type Static } from "@sinclair/typebox"

/**
 * TypeBox schema for BusStop model response
 * Based on the BusStop Mongoose model
 * @see {@link module:models/BusStop}
 */
export const BusStopResponseSchema = Type.Object({
    _id: Type.String({
        description: "MongoDB ObjectId of the bus stop",
    }),
    ATCO_long: Type.String({
        description: "Long ATCO code identifier",
    }),
    ATCO_short: Type.Optional(
        Type.String({
            description: "Short ATCO code identifier",
        })
    ),
    CommonName: Type.Optional(
        Type.String({
            description: "Common name of the bus stop",
        })
    ),
    Street: Type.Optional(
        Type.String({
            description: "Street name where the bus stop is located",
        })
    ),
    Longitude: Type.Optional(
        Type.String({
            description: "Longitude coordinate as string",
        })
    ),
    Latitude: Type.Optional(
        Type.String({
            description: "Latitude coordinate as string",
        })
    ),
    Northing: Type.String({
        description: "British National Grid Northing coordinate",
    }),
    Easting: Type.String({
        description: "British National Grid Easting coordinate",
    }),
    __v: Type.Optional(
        Type.Number({
            description: "Mongoose version key",
        })
    ),
})

export type BusStopResponse = Static<typeof BusStopResponseSchema>
