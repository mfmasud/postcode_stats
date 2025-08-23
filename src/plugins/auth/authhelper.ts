// This file will setup the auth middleware and expose a login route
// Using fastify-jwt plugin for JWT authentication

// SETUP PHASE:
// 1. Register fastify-jwt plugin with JWT_SECRET from environment
// 2. Configure JWT extraction from Authorization Bearer header
// 3. Setup token verification options (expiry, algorithm, etc.)

// AUTHENTICATION MIDDLEWARE:
// 1. Create preHandler hook that verifies JWT token
// 2. Extract user ID from decoded JWT payload
// 3. Look up user in database using User.findById() 
// 4. Populate user role information if needed
// 5. Attach verified user object to request context
// 6. Handle authentication failures with appropriate error responses
