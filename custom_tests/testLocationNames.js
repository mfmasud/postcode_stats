require("dotenv").config();

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
    console.log(error);
  }
})();

try {
  getScotlandLocations().then((locations) => {
    console.log(locations);
  });
} catch (error) {
  console.error(error);
}

/*
try {
    getEnglandLocations().then((locations) => {
        console.log(locations);
    });
} catch (error) {
    console.error(error);
}
*/

try {
  getWalesLocations().then((locations) => {
    console.log(locations);
  });
} catch (error) {
  console.error(error);
}

/*
// NOT HANDLED BY NAPTAN API!
// see https://www.data.gov.uk/dataset/495c6964-e8d2-4bf1-9942-8d950b3a0ceb/translink-bus-stop-list
try {
    getNILocations().then( (locations) => {
        console.log(locations)
    });
} catch (error) {
    console.error(error);
}
*/
