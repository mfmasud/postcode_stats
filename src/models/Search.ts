/**
 * @file Contains the mongoose schema for the Search model. This model is used to store the results of a search query.
 * @module models/Search
 * @author Mohammed Fardhin Masud <fardhinmasud@gmail.com>
 *
 * @requires mongoose
 *
 * @exports Search
 *
 * @see {@link module:models/Postcode} for the Postcode model which is used in this schema.
 * @see {@link module:models/BusStop} for the BusStop model which is used in this schema.
 * @see {@link module:models/Crime} for the Crime model which is used in this schema.
 * @see {@link module:models/Atco} for the Atco model which is used in this schema.
 * @See {@link module:models/CrimeList} for the CrimeList model which is used in this schema.
 * @see {@link module:helpers/search} for the helper files used to link data to the model.
 * @see {@link module:routes/search} for the routes which uses this model.
 *
 */

import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
} from "mongoose"

import Counter from "./Counter.js"

const searchSchema = new Schema({
    searchID: {
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
    Northing: {
        type: String,
        required: true,
    },
    Easting: {
        type: String,
        required: true,
    },
    reverseLookup: {
        type: Boolean,
        default: false,
    },
    Postcode: {
        type: Schema.Types.ObjectId,
        ref: "Postcode",
    },
    queryBusStops: [
        {
            type: Schema.Types.ObjectId,
            ref: "BusStop",
        },
    ],
    queryCrimes: [
        {
            type: Schema.Types.ObjectId,
            ref: "Crime",
        },
    ],
    linkedATCO: {
        type: Schema.Types.ObjectId,
        ref: "Atco",
    },
    linkedCrimeList: {
        type: Schema.Types.ObjectId,
        ref: "CrimeList",
    },
    _links: {
        self: {
            href: {
                type: String,
            },
        },
        postcode: {
            href: {
                type: String,
            },
        },
        alternate: {
            href: {
                type: String,
            },
        },
    },
})

export type SearchInferredSchema = InferSchemaType<typeof searchSchema>
export type SearchDoc = HydratedDocument<SearchInferredSchema>

searchSchema.pre("validate", async function save(this: SearchDoc) {
    // if the document is not new, do not set a new ID
    if (!this.isNew || this.searchID != null) return

    let newID = await Counter.next("search") // get the next ID

    while (await Search.exists({ searchID: newID })) {
        // if the ID already exists, try again
        newID = await Counter.next("search") // increment the ID and try again
    }

    this.searchID = newID // set the new ID
})

const Search = model<SearchInferredSchema>("Search", searchSchema)

export default Search
