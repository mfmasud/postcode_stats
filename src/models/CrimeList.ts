/**
 * @file Contains the mongoose CrimeList model schema. Sums up the results of a query made to the Police API so that it can be used by and linked to the Search model.
 * @module models/CrimeList
 * @author Mohammed Fardhin Masud <fardhinmasud@gmail.com>
 *
 * @requires mongoose
 *
 * @exports CrimeList
 *
 * @see {@link module:models/Crime} for the Crime model which is used in this model's crimes field.
 * @see {@link module:models/Search} for the Search model which links this model.
 * @see {@link module:helpers/crime} for the helper functions used to retrieve data for this model.
 *
 */

import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose"

import Counter from "./Counter.js"

const crimeListSchema = new Schema({
    crimeListID: {
        type: Number,
        required: true,
        unique: true,
        index: true,
        immutable: true,
    },
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    count: {
        type: Number,
        default: 0,
    },
    crimes: [
        {
            type: Schema.Types.ObjectId,
            ref: "Crime",
        },
    ],
    date: {
        type: String, // Move to a datetime in the future
    },
    emptydata: {
        type: Boolean,
        default: false,
    },
})

export type CrimeListInferredSchema = InferSchemaType<typeof crimeListSchema>
export type CrimeListDoc = HydratedDocument<CrimeListInferredSchema>

crimeListSchema.pre("validate", async function (this: CrimeListDoc) {
    // if the document is not new, do not set a new ID
    if (!this.isNew || this.crimeListID != null) return

    let newID = await Counter.next("crimeList") // get the next ID

    while (await CrimeList.exists({ crimeListID: newID })) {
        // if the ID already exists,
        newID = await Counter.next("crimeList") // increment the ID and try again
    }

    this.crimeListID = newID // set the new ID
})

const CrimeList = model<CrimeListInferredSchema>("CrimeList", crimeListSchema)

export default CrimeList
