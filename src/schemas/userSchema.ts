// schemas/userSchema.ts
import { Type, type Static } from '@sinclair/typebox';
import { ErrorResponseSchema } from './commonSchema.js';

// Common reusable ID param
export const UserIdParamSchema = Type.Object({
  id: Type.String({
    pattern: '^\\d+$',
    description: 'User identifier (numeric string)',
  })
});

// GET /users/:id response schema
export const GetUserResponseSchema = Type.Object({
  id: Type.String({ pattern: '^\\d+$', description: 'User identifier (numeric string)' }),
  firstName: Type.Optional(Type.String({ description: 'User first name' })),
  lastName: Type.Optional(Type.String({ description: 'User last name' })),
  about: Type.Optional(Type.String({ description: 'User bio/about section' })),
  username: Type.String({ description: 'User username' }),
  email: Type.String({ format: 'email', description: 'User email address' }),
  role: Type.String({ description: 'User role name' }),
  dateRegistered: Type.String({ format: 'date-time', description: 'User registration date' }),
  password: Type.Optional(Type.String({ description: 'Hashed password (only if role has permission to read)' })),
});

// PUT /users/:id response schema - Returns success flag and updated user
export const UpdateUserResponseSchema = Type.Object({
  success: Type.Boolean({ description: 'Indicates if the update was successful' }),
  user: GetUserResponseSchema,
});

// DELETE /users/:id response schema - Returns success flag and deleted user info
export const DeleteUserResponseSchema = Type.Object({
  success: Type.Boolean({ description: 'Indicates if the deletion was successful' }),
  user: GetUserResponseSchema,
});

// GET /users (getAllUsers) schema
export const GetAllUsersSchema = {
  response: {
    200: Type.Array(GetUserResponseSchema),
    401: ErrorResponseSchema, // User not logged in
    403: ErrorResponseSchema, // No permission to view all users
    404: ErrorResponseSchema, // No users found
  },
};

// POST /users (createUser) schema
export const CreateUserSchema = {
  body: Type.Object({
    username: Type.String(),
    password: Type.String(),
    email: Type.String(),
  }),
  response: {
    201: Type.Object({
      username: Type.String(),
      email: Type.String(),
      role: Type.String(),
    }),
    400: ErrorResponseSchema, // Empty fields or duplicate username/email
    500: ErrorResponseSchema, // User creation failed
  },
};

// GET /users/:id (getUserById) schema
export const GetUserByIdSchema = {
  params: UserIdParamSchema,
  response: {
    200: GetUserResponseSchema,
    400: ErrorResponseSchema, // Invalid user ID
    401: ErrorResponseSchema, // Not logged in
    403: ErrorResponseSchema, // Not allowed to read user
    404: ErrorResponseSchema, // User not found
  },
};

export const UpdateUserByIdSchema = {
  params: UserIdParamSchema,
  body: Type.Object({
    firstName: Type.Optional(Type.String()),
    lastName: Type.Optional(Type.String()),
    about: Type.Optional(Type.String()),
    password: Type.Optional(Type.String()),
    email: Type.Optional(Type.String()),
  }),
  response: {
    200: UpdateUserResponseSchema,
    400: ErrorResponseSchema, // Invalid user ID
    401: ErrorResponseSchema, // Not logged in
    403: ErrorResponseSchema, // Not allowed to update
    500: ErrorResponseSchema, // Update failed
  },
};

export const DeleteUserByIdSchema = {
  params: UserIdParamSchema,
  response: {
    200: DeleteUserResponseSchema,
    400: ErrorResponseSchema, // Invalid user ID
    401: ErrorResponseSchema, // Not logged in
    403: ErrorResponseSchema, // Not allowed to delete
    500: ErrorResponseSchema, // Deletion failed
  },
};

// ---- Types (for compile-time) ----

// Bodies
export type CreateUserBody = Static<typeof CreateUserSchema.body>;
export type UpdateUserBody = Static<typeof UpdateUserByIdSchema.body>;

export type GetUserResponse = Static<typeof GetUserResponseSchema>;
export type UpdateUserResponse = Static<typeof UpdateUserResponseSchema>;
export type DeleteUserResponse = Static<typeof DeleteUserResponseSchema>;
