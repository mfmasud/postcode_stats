require('dotenv').config()
// console.log(process.env)

const Koa = require('koa');
const app = new Koa();

const database = require('./helpers/database');

const special = require('./routes/special');
const postcodes = require('./routes/postcodes');
const users = require('./routes/users');
const search = require('./routes/search')

app.use(special.routes());
app.use(postcodes.routes());
app.use(users.routes());
app.use(search.routes());

let port = process.env.PORT;

async function startServer(app, port) {
  try {
    // reset dummy dbs - not awaited yet
    database.connectDB(true);
    database.initUserDB();
    database.initLocationDB();
    //database.resetDataDB();

    // start koa server
    app.listen(port, () => {
      console.log('Server running on port', port);
    });
  } catch (error) {
    console.error(`Error starting server:\n${error.message}`);
  }
}

startServer(app, port);
