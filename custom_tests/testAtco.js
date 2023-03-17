const atco = require('../helpers/AtcoCodes');

try {
  atco.getAtcoCodes().then(codes => {
    // remove first using shift():
    // https://stackoverflow.com/a/29606016
    codes.shift();

    codes.forEach(code => {
    console.log(code);
  })
  });
} catch (error) {
  console.error(error);
}
