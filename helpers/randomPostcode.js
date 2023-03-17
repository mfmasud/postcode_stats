const axios = require('axios');

async function getRandomPostcode() {
    try {
      const response = await axios.get('https://api.postcodes.io/random/postcodes');
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

module.exports = {
    getRandomPostcode
}
