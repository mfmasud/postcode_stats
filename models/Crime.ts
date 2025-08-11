/**
 * @file Contains the mongoose Crime model schema. This model is used to store the results of a query made to the Police API into the Crimes collection.
 * @module models/Crime
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires mongoose
 *
 * @exports Crime
 *
 * @see {@link module:models/CrimeList} for the CrimeList model which uses these Crime models.
 * @see {@link module:helpers/crime} for the helper functions used to retrieve data for this model.
 *
 */

import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const crimeSchema = new Schema({
  crimeID: {
    type: Number,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  crime_category: {
    type: String,
  },
  crime_date: {
    type: String,
  },
  outcome_category: {
    type: String,
  },
  outcome_date: {
    type: String,
  },
});

export type CrimeInferredSchema = InferSchemaType<typeof crimeSchema>;
export type CrimeDoc = HydratedDocument<CrimeInferredSchema>;

const Crime = model<CrimeInferredSchema>('Crime', crimeSchema);

export default Crime;
