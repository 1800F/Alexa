var Flowers = require('../services/Flowers')
  , config = require('../config')
	, flowers = Flowers(config.flowers)
  , first = 'Christian'
  , lastname = 'Torres'
  , random = getRandomInt(20, 1000)
  , email = 'chtorrez@donotexist.com'
  , password = 'secreto'
  , confirm = 'secreto'
;

flowers
	.createCustomer(email, password)
	.then(function (user) {
    console.log('Create User:' + user.registerNewCustomerResponse.customerData.customerID);
    if (user.registerNewCustomerResponse.error.errorCode) {
      console.log("ERROR CODE EXISTS: " + user.registerNewCustomerResponse.error.errorCode);
    } else {
      console.log("ERROR CODE DOESN'T EXIST");

      flowers.addCustomerDetails(first, lastname, email, user.registerNewCustomerResponse.customerData.systemID)
      	.then(function (details) {
        	if (details.AddPersonResponse) {
          	console.log(JSON.stringify(details));
        	}
      });
    }
  })
  .catch(function (err) {
    console.log("Error Creating User: " + err + "\r");
  })
;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}