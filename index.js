require('dotenv').config()
// console.log(process.env)

const Koa = require('koa');
const app = new Koa();

const database = require('./helpers/database.js');

const special = require('./routes/special.js');
const postcodes = require('./routes/postcodes');
const users = require('./routes/users');

app.use(special.routes());
app.use(postcodes.routes());
app.use(users.routes());

let port = process.env.PORT;

async function startServer(app, port) {
  try {
    // reset dummy db
    database.connectDB(true);
    database.initUserDB();
    database.resetDataDB();

    // start koa server
    app.listen(port, () => {
      console.log('Server running on port', port);
    });
  } catch (error) {
    console.error(`Error starting server:\n${error.message}`);
  }
}

startServer(app, port);
