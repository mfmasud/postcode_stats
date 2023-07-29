/**
 * @file Authentication middleware for the API. Uses passport to allow anonymous users and basic HTTP access to the API. Allows for Role Based Access Control (RBAC) by using @casl/ability to determine access levels.
 * @module controllers/auth
 * @author Mohammed Fardhin Masud <masudm6@coventry.ac.uk>
 *
 * @requires koa-passport
 * @requires module:strategies/basic
 * @requires passport-anonymous
 *
 * @see {@link models/User} for the User model which is used by the basic HTTP strategy.
 * @see {@link models/Role} for the Role model used to assign access levels.
 *
 */

const passport = require("koa-passport");
const basicAuth = require("../strategies/basic");
const jwtAuth = require("../strategies/jwt");
const AnonymousStrategy = require("passport-anonymous").Strategy;

passport.use(new AnonymousStrategy()); // anonymous users e.g. not logged in
passport.use(basicAuth); // HTTP basic auth strategy, may be changed to JWT/OAuth2
passport.use(jwtAuth); // JWT auth strategy

module.exports = passport.authenticate(["anonymous", "basic", "jwt"], {
  session: false,
});
