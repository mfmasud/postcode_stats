const postcode = require('../helpers/postcode');

// promises at the top level:
// https://stackoverflow.com/a/46515787 - info
// https://stackoverflow.com/a/45609128 - using .then()

try {
  postcode.getRandomPostcode().then(randomPostcode => {
  console.log(randomPostcode);
});

} catch (error) {
  console.error(error);
}
