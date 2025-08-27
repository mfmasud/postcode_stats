import { Type } from "@sinclair/typebox";

export const LoginQuerySchema = Type.Object({
  id: Type.String(),
});

export const LoginResponseSchema = Type.Object({
  jwt: Type.String(),
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
} as const; 