/**
 * @file Contains the BusStop model schema. This stores a condensed version of the ATCO data retrieved from the NAPTAN (National Public Transport Access Nodes) API.
 * @module models/BusStop
 * @author Mohammed Fardhin Masud <fardhinmasud@gmail.com>
 *
 * @requires mongoose
 *
 * @exports BusStop
 *
 * @see {@link module:models/Atco} for the Atco model which uses this model.
 * @see {@link module:helpers/AtcoCodes} which has helper functions storing condensed versions of the ATCO data using this model.
 *
 */

import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose"

const busStopSchema = new Schema({
    ATCO_long: {
        type: String,
        required: true,
    },
    ATCO_short: {
        type: String,
    },
    CommonName: {
        type: String,
    },
    Street: {
        type: String,
    },
    Longitude: {
        type: String,
    },
    Latitude: {
        type: String,
    },
    Northing: {
        type: String,
        required: true,
    },
    Easting: {
        type: String,
        required: true,
    },
})

export type BusStopInferredSchema = InferSchemaType<typeof busStopSchema>
export type BusStopDoc = HydratedDocument<BusStopInferredSchema>

const BusStop = model<BusStopInferredSchema>("BusStop", busStopSchema)

export default BusStop
