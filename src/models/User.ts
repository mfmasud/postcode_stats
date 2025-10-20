/**
 * @file Contains the User model schema and exported model used to authenticate users. Originally based off of 6003CEM lab work.
 * @module models/User
 * @author Mohammed Fardhin Masud <fardhinmasud@gmail.com>
 *
 * @requires mongoose
 * @requires validator
 * @requires utils/logger
 * @requires bcrypt
 *
 * @exports User
 *
 * @see {@link module:routes/users} for the routes which perform CRUD operations on this model.
 * @see {@link module:models/Role} for the Role model used in this schema.
 * @see {@link module:controllers/auth} for the authentication middleware used in the routes.
 * @See {@link https://stackoverflow.com/a/28396238} for more on the approach used to validate email addresses.
 *
 */

import Counter from "./Counter.js"
import type { RoleInferredSchema, RoleDoc } from "./Role.js"

import logger from "../utils/logger.js"

import {
    Schema,
    model,
    type InferSchemaType,
    type HydratedDocument,
    type Model,
    type Types,
} from "mongoose"

/* validation: 
https://mongoosejs.com/docs/validation.html
https://pinoria.com/how-to-validate-email-syntax-with-mongoose/
https://stackoverflow.com/a/28396238
https://github.com/validatorjs/validator.js
*/
import validator from "validator"

import bcrypt from "bcrypt" // https://www.npmjs.com/package/bcrypt
const saltRounds = 10

const userSchema = new Schema({
    id: {
        type: Number,
        unique: true,
        index: true,
        immutable: true,
    },
    firstName: String,
    lastName: String,
    username: {
        type: String,
        required: true,
        unique: true,
    },
    about: String,
    dateRegistered: {
        type: Date,
        default: Date.now,
    },
    password: {
        type: String,
        required: true,
    },
    passwordSalt: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, "invalid email"],
    },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
})

export type UserInferredSchema = InferSchemaType<typeof userSchema>

export type UserDoc = HydratedDocument<
    UserInferredSchema & { role: Types.ObjectId | RoleDoc }
>

export type UserDocWithRole = HydratedDocument<
    UserInferredSchema & { role: RoleDoc }
>

export interface AuthUser extends Omit<UserInferredSchema, "role"> {
    role: RoleInferredSchema
}

userSchema.pre("validate", async function preValidate(this: UserDoc) {
    if (!this.isNew || this.id != null) {
        return
    }

    // https://stackoverflow.com/a/30164636
    let newID = await Counter.next("user")
    while (await User.exists({ id: newID })) {
        newID = await Counter.next("user")
    }
    this.id = newID
})

userSchema.pre("save", async function preSave(this: UserDoc) {
    if (!this.isModified("password")) {
        return
    }

    const salt = await bcrypt.genSalt(saltRounds)
    this.passwordSalt = salt
    this.password = await bcrypt.hash(this.password, salt)
    logger.info(`password modified/created for user: ${this.username}`)
})

userSchema.statics.findByUsername = async function findByUsername(
    username: string
) {
    //logger.info('findByUsername called');
    let user = await this.findOne({ username: username })
    if (user) {
        user = await user.populate("role")
        return user
    }
    return null
}

export interface UserModel extends Model<UserInferredSchema> {
    findByUsername(username: string): Promise<UserDoc | null>
}

const User = model<UserInferredSchema, UserModel>("User", userSchema)

export default User
