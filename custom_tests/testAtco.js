require('dotenv').config()

const atco = require('../helpers/AtcoCodes');
const {connectDB, resetDataDB}= require('../helpers/database');

( async() => {
  // I am trying to make this run first before anything but according to the logs that is not the case.
  // still, no errors mean it probably works.
  try {
    await connectDB()
    //await resetDataDB();
  } catch (error) {
    console.log(error)
  }
  
})();

try {
  atco.saveAtcoList().then( () => {
    // code 420 is for Warwickshire / West Midlands:
    atco.queryAtco("csv", 420).then( () => {
      // console will show logs.
    });
  });
  
} catch (error) {
  console.error(error);
}
