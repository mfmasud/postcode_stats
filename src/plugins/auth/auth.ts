// This file will use the auth middleware in a getuserdetails route

// USERDETAILS ROUTE WITH JWT PREAUTH HANDLER:

// Route: GET /api/v2/private
// Purpose: Return authenticated user's details

// JWT PREAUTH HANDLER:
// 1. Extract JWT token from Authorization header (Bearer format)
// 2. Verify token using jsonwebtoken.verify() with JWT_SECRET OR fastify-jwt.verify() [Research Point 1]
// 3. Decode payload to get user._id
// 4. Query database: User.findById(decoded._id)
// 5. If user found, attach to request.user property (pre-decorated request object)
// 6. If token invalid/expired or user not found, throw 401 error

// USERDETAILS HANDLER FUNCTION:
// 1. Access authenticated user from request.user (set by preauth handler)
// 2. Return user details in response body
// 3. Include user.username, user.role
// 4. Return 200 status with user object

// AUTHENTICATION FLOW:
// Client -> Authorization: Bearer <token> -> PreAuth Handler -> Verify Token -> 
// Look up User -> Attach to Request -> UserDetails Handler -> Return User Data

// EXAMPLE USAGE FLOW:
// 1. User gets a token from /api/v2/login and sets it in the Authorization header
// 2. User accesses a protected route with a set Authorization: Bearer <token>
// 3. PreAuth handler validates token and loads user
// 4. route handler/middleware returns user information for the associated user.

// RESEARCH POINTS:
// [1] - How to use fastify-jwt.verify() to verify the token?
// This should be implemented into the authhelper.ts file.