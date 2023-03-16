const Router = require("koa-router");

const auth = require("../controllers/auth");

const router = Router({ prefix: "/api/v1" });
router.get("/", publicAPI);
router.get("/private", auth, privateAPI);
router.get("/private2", auth, UserDetails); // for testing purposes

function publicAPI(ctx) {
  ctx.body = {
    message: "Hello and welcome to the Real Estate Listings API!",
  };
}

function privateAPI(ctx) {
  const user = ctx.state.user;
  ctx.body = {
    message: `Hello ${user.username} you registered on ${user.dateRegistered}`,
  };
}

function UserDetails(ctx) {
  const user = ctx.state.user;
  ctx.body = {
    user,
  };
}

module.exports = router;
