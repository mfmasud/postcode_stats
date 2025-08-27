import { Type, type Static } from "@sinclair/typebox";

export const ErrorResponseSchema = Type.Object({
    error: Type.String({
        description: "Error message type or code"
    }),
    message: Type.String({
        description: "Error message content"
    }),
  });
  
  export type ErrorResponse = Static<typeof ErrorResponseSchema>;