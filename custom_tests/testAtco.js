const atco = require('../helpers/AtcoCodes');

try {
  atco.getAtcoCodes().then(codes => {
    codes.forEach(code => {
    console.log(atco.processAtco(code));
    })
  });

  // code 420 is for Warwickshire / West Midlands:
  atco.queryAtco("csv", 420).then(csvdata => {
    //console.log(csvdata)
  })

} catch (error) {
  console.error(error);
}
