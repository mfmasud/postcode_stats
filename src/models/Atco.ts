/**
 * @file Contains the Atco model schema.
 * @module models/Atco
 * @author Mohammed Fardhin Masud <fardhinmasud@gmail.com>
 *
 * @requires mongoose
 *
 * @exports Atco
 *
 * @see {@link module:models/BusStop} for the BusStop model which is used by this model schema.
 * @see {@link module:models/Search} for the Search model which links this model.
 * @see {@link module:helpers/AtcoCodes~processCSV} for the function which processes data for this model.
 *
 */

import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose"

const atcoSchema = new Schema({
    code: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    region: {
        type: String,
        required: true,
    },
    busstops: [
        {
            type: Schema.Types.ObjectId,
            ref: "BusStop",
        },
    ],
    AllProcessed: {
        type: Boolean,
        required: true,
    },
    other_names: [
        {
            type: String,
        },
    ],
})

export type AtcoInferredSchema = InferSchemaType<typeof atcoSchema>
export type AtcoDoc = HydratedDocument<AtcoInferredSchema>

const Atco = model<AtcoInferredSchema>("Atco", atcoSchema)

export default Atco
