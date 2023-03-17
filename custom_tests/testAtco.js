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

  // code 420 is for Warwickshire / West Midlands:
  atco.queryAtco("csv", 420).then(csvdata => {
    //console.log(csvdata)
  })

} catch (error) {
  console.error(error);
}
