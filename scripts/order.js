var Flowers = require('../services/Flowers')
  , Product = require('../services/Product')
  , Purchase = require('../services/Purchase')
  , config = require('../config')
  , moment = require('moment')
  , _ = require('lodash')
  , alexaFlowers = require('../services/alexa-flowers.js')
;

/*
1.  getCustomerDetails (FlowersUser.getCustomerDetails)
2.  Get recipient information (FlowersUser.getRecipients)
3.  After they select a recipient, get the recipient address (FlowersUser.getRecipientAddress)
4.  Select the arrangement to purchase, and get it's pricing and other information (Product.getProductDetails)
5.  Get the delivery date (Product.getDeliveryCalendar)
6.  Get shipping charges (Purchase.getShipping)
7.  Get taxes (Purchase.getTaxes)
8.  Get Payment Information (FlowersUser.getPaymentMethods)
9.  Authorize purchase (Purchase.authorizeCC) -- the credit card is returned encrypted and tokenized in the getPaymentMethods call.
10.  Send the order (FlowersUser.submitOrder)
*/

var _1steven = '4b890c26-0a48-4291-8cdb-654d7d1588be'
  , juangtest = 'b7c2d8ba-50dc-4d6c-a4e4-90f51817d859'
  , mitchellkharris = '1314833911'
;

var flowers = Flowers(config.flowers)
  , user = null
  , systemId = mitchellkharris
  , customerId = null
  , customerDetails = null
  , card = null
  , recipients = null
  , recipient = null
  , deliveryDate = moment().day(8)
  , arrangementBaseSku = '90950'
  , arrangementDetails = null
  , item = null
  , purchase = null
  , purchaseToken = null
  , charges = null
  , taxes = null
  , charges = null
;

flowers.login(config.skill.defaultCredentials.username,config.skill.defaultCredentials.password)
.then(function(usr){ user = usr; })
.then(function(){
  return user.getPaymentMethods(systemId);
}).then(function(payMethods){
  card = alexaFlowers.pickCard(payMethods);
})
.then(function(){ return user.getCustomerDetails(systemId); })
.then(function(profile){
  customerDetails = profile;
  customerId = profile.customerId;
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
.then(function(){ return Product(config.flowers, arrangementBaseSku).getProductDetails() })
.then(function(details){
  arrangementDetails = {
    prodType: details.product.prodType,
    items: _.map(details.product.skuList.sku,function(sku){ return sku; })
  };
  item = arrangementDetails.items[0];
})
.then(function(){
  purchase = Purchase(config.flowers);
  return purchase.login();
})
.then(function(tokens){
  purchaseToken = tokens.access_token;
})
.then(function(){
  return purchase.getShipping({
    productSku: item.productSku,
    prodType: arrangementDetails.prodType,
    itemPrice: item.skuOfferPrice,
  },address,deliveryDate);
}).then(function(shipping){
  charges = {
    item: +item.skuOfferPrice,
    shippingBase: +shipping[0].baseCharge,
    surcharge: +shipping[0].totSurcharge,
    upcharge: +shipping[0].upCharge,
  };
  charges.shippingTotal = charges.shippingBase + charges.surcharge + charges.upcharge;
  charges.total = charges.item + charges.shippingTotal;
})
.then(function(){
  return purchase.getTaxes(item.productSku, address.postalCode, item.skuOfferPrice, charges.total);
}).then(function(txs){
  charges.taxes = +txs;
  charges.total +=  +txs;
})
.then(function(){
  return purchase.authorizeCC(purchaseToken, card, charges.total, customerDetails);
})
.then(function(auth){
  console.log('Auth');
  console.log(auth);
})
;

