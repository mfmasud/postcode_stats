require("dotenv").config();
const logger = require("../utils/logger");

const {
  getScotlandLocations,
  getEnglandLocations,
  getWalesLocations,
} = require("../helpers/locations");

const { connectDB } = require("../helpers/database");

(async () => {
  try {
    await connectDB();
  } catch (error) {
    logger.error(error);
  }
})();

try {
  getScotlandLocations().then((locations) => {
    logger.info(locations);
  });
} catch (error) {
  logger.error(error);
}

/*
try {
    getEnglandLocations().then((locations) => {
        logger.info(locations);
    });
} catch (error) {
    logger.error(error);
}
*/

try {
  getWalesLocations().then((locations) => {
    logger.info(locations);
  });
} catch (error) {
  logger.error(error);
}

/*
// NOT HANDLED BY NAPTAN API!
// see https://www.data.gov.uk/dataset/495c6964-e8d2-4bf1-9942-8d950b3a0ceb/translink-bus-stop-list
try {
    getNILocations().then( (locations) => {
        logger.info(locations)
    });
} catch (error) {
    logger.error(error);
}
*/
