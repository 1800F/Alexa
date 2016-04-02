var Flowers = require('../services/Flowers')
  , config = require('../config')
  , moment = require('moment')
;

/*
1.  getCustomerDetails (FlowersUser.getProfile)
2.  Get recipient information (FlowersUser.getRecipients)
3.  After they select a recipient, get the recipient address (FlowersUser.getRecipientAddress)
4.  Select the arrangement to purchase, and get it's pricing and other information (Product.getProductDetails)
5.  Get the delivery date (Product.getDeliveryCalendar)
6.  Get shipping charges (Product.getShipping)
7.  Get taxes (Product.getTaxes)
8.  Get Payment Information (FlowersUser.getPaymentMethods)
9.  Authorize purchase (Purchase.authorizeCC) -- the credit card is returned encrypted and tokenized in the getPaymentMethods call.
10.  Send the order (FlowersUser.submitOrder)
*/

var flowers = Flowers(config.flowers)
  , user = null
  , systemId = '33b445e9-3c81-42d2-bc71-cf4f11e1a693'
  , customerId = null
  , userProfile = null
  , recipients = null
  , recipient = null
  , deliveryDate = moment().day(1).format('DD-MM-YYYY')
  , arrangementSku = '90950S'
  , purchase = null
;

flowers.login(config.skill.defaultCredentials.username,config.skill.defaultCredentials.password)
.then(function(usr){ user = usr; })
.then(function(){ return user.getProfile(systemId); })
.then(function(puserProfile){
  userProfile = puserProfile;
  customerId = userProfile.Get18FCustomerByAdminSysKeyResponse.result.response.idPK;
})
.then(function(){ return user.getRecipients(customerId); })
.then(function(recp){
  recipients = recp;
  recipient = recp[0];
})
.then(function(){ return user.getRecipientAddress(recipient.demoGraphicsID,recipient.cont_id); })
.then(function(addr){
  address = addr;
})
.then(function(){
  console.log('TRYING TO LOGIN')
  purchase = Flowers.Purchase(config.flowers);
  return purchase.login();
})
.then(function(){
  console.log('LOGGED IN')
  return purchase.getShipping({
    productSku: arrangementSku,
    productSku: prodType,
    itemPrice: 19.99
  },address,self.deliveryDate);
}).then(function(shipping){
})
