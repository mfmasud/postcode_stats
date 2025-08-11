/**
 * @file Defines the Nptg model schema, condensed from the National Public Transport Gazetteer (NPTG). Can only be used for Scotland, England and Wales.
 * @module models/Nptg
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires mongoose
 *
 * @exports Nptg
 *
 * @see {@link module:models/BusStop} for the BusStop model. A "NptgLocalityCode" field is present in the original ATCO data and can be used to link the two.
 * @see {@link processNptgCSV} for the function which processes data for this model.
 *
 */

import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const NptgSchema = new Schema({
  NptgLocalityCode: {
    type: String,
    required: true,
  },
  Easting: {
    type: Number,
    required: true,
  },
  Northing: {
    type: Number,
    required: true,
  },
  LocalityName: {
    type: String,
    required: true,
  },
  QualifierName: {
    type: String,
  },
  ParentLocalityName: {
    type: String,
  },
});

export type NptgInferredSchema = InferSchemaType<typeof NptgSchema>;
export type NptgDoc = HydratedDocument<NptgInferredSchema>;

const Nptg = model<NptgInferredSchema>('Nptg', NptgSchema);

export default Nptg;
