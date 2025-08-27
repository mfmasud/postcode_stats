import { Type, type Static } from "@sinclair/typebox";

export const LoginQuerySchema = Type.Object({
    id: Type.String({
        minLength: 1,
        description: "Login user identifier (cannot be empty)",
    }),
});

export const LoginResponseSchema = Type.Object({
  jwt: Type.String({
    description: "JWT token for the user",
  }),
});

export const ErrorResponseSchema = Type.Object({
  error: Type.String(),
  message: Type.String(),
});

export const LoginRouteSchema = {
  querystring: LoginQuerySchema,
  response: {
    200: LoginResponseSchema,
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}

export type LoginQuery = Static<typeof LoginQuerySchema>
export type LoginResponse = Static<typeof LoginResponseSchema>
export type ErrorResponse = Static<typeof ErrorResponseSchema>
