const passport = require("koa-passport");
const basicAuth = require("../strategies/basic");
const AnonymousStrategy = require("passport-anonymous").Strategy;

passport.use(new AnonymousStrategy()); // anonymous users e.g. not logged in
passport.use(basicAuth); // HTTP basic auth strategy, may be changed to JWT/OAuth2

module.exports = passport.authenticate(["basic", "anonymous"], {
  session: false,
});
