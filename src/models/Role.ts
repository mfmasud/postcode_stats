/**
 * @file Contains the Role model schema which is used by the User model to assign access levels to users.
 * @module models/Role
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires mongoose
 *
 * @exports Role
 *
 * @see {@link module:models/User} for the User model which has a role field which uses this model.
 *
 */

import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const RoleSchema = new Schema({
  name: {
    type: String,
    required: true,
    default: "user",
    enum: ["none", "user", "paiduser", "admin"],
  },
  description: {
    type: String,
  },
});

export type RoleInferredSchema = InferSchemaType<typeof RoleSchema>;
export type RoleDoc = HydratedDocument<RoleInferredSchema>;

const Role = model<RoleInferredSchema>('Role', RoleSchema);

export default Role;
