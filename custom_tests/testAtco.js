require("dotenv").config();
const logger = require("../utils/logger");

const atco = require("../helpers/AtcoCodes");
const { connectDB, resetDataDB } = require("../helpers/database");

(async () => {
  // I am trying to make this run first before anything but according to the logs that is not the case.
  // still, no errors mean it probably works.
  try {
    await connectDB();
    //await resetDataDB();
  } catch (error) {
    logger.error(error);
  }
})();

try {
  atco.saveAtcoList().then(() => {
    // code 430 is for West Midlands:
    atco.queryAtcoAPI(430).then(() => {
      // console will show logs.
    });
  });
} catch (error) {
  logger.error(error);
}
