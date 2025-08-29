const postcode = require("../../src/helpers/postcode");
const database = require("../../src/helpers/database");

const logger = require("../../src/utils/logger");

database.connectDB();

// promises at the top level:
// https://stackoverflow.com/a/46515787 - info
// https://stackoverflow.com/a/45609128 - using .then()

try {
  postcode.getRandomPostcode().then((randomPostcode) => {
    logger.info(randomPostcode);
  });
} catch (error) {
  logger.error(error);
}
