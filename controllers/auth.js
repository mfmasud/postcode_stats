/**
 * @file Authentication middleware for the API. Uses passport to allow HTTP access to the API. Allows for Role Based Access Control (RBAC) by using @casl/ability to determine access levels.
 * @module controllers/auth
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires koa-passport
 * @requires module:strategies/jwt
 * @requires passport-anonymous
 *
 * @see {@link models/User} for the User model which will be authenticated.
 * @see {@link models/Role} for the Role model used to assign access levels.
 *
 */

const passport = require("koa-passport");
const jwtAuth = require("../strategies/jwt").strategy;
const AnonymousStrategy = require("passport-anonymous").Strategy;

passport.use(new AnonymousStrategy()); // anonymous users e.g. not logged in
passport.use(jwtAuth); // JWT auth strategy

module.exports = passport.authenticate(["jwt", "anonymous"], {
  session: false,
});
