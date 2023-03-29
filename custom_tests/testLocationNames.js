const { getScotlandLocations, getEnglandLocations } = require("../helpers/locations");

try {
    getScotlandLocations().then( (locations) => {
        console.log(locations)
    });
} catch (error) {
    console.error(error);
}

try {
    getEnglandLocations().then( (locations) => {
        console.log(locations)
    });
} catch (error) {
    console.error(error);
}

/*
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
