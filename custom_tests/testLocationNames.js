require("dotenv").config();

const {
    getScotlandLocations,
    getEnglandLocations,
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


try {
    getWalesLocations().then( (locations) => {
        console.log(locations)
    });
} catch (error) {
    console.error(error);
}

try {
    getNILocations().then( (locations) => {
        console.log(locations)
    });
} catch (error) {
    console.error(error);
}
*/
