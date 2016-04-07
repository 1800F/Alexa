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
  , christian = '1314839386'
;

var flowers = Flowers(config.flowers)
  , user = null
  , systemID = christian //mitchellkharris
  , customerDetails = null
  , card = null
  , recipients = null
  , recipient = null
  , deliveryDate = moment().day(8)
  , arrangementBaseSku = '90950'
  , arrangementDetails = null
  , item = null
  , purchase = null
  , charges = null
  , taxes = null
  , charges = null
;

flowers.buildUser(systemID)
.then(function(usr){ user = usr; })
.then(function(){ return user.getCustomerDetails(); }) //We've got to get this to fetch the customerID
.then(function(profile){
  customerDetails = profile;
})
.then(function(){
  return user.getPaymentMethods();
}).then(function(payMethods){
  card = alexaFlowers.pickCard(payMethods);
})
.then(function(){ return user.getRecipients(); })
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
  // return purchase.authorizeCC(card, charges.total, customerDetails);
// })
// .then(function(auth){
  // console.log('Auth');
  // console.log(auth);

  /*
    Product {"amount":1,"tax":0,"shipping":14.99,"sku":"100299S","price":49.99,"deliveryDate":"2016-04-11T06:00:00.000Z","total":64.98}
    User {"tokens":{"access_token":"AAEFYy1hbGwQC6I8fvKZS4V6BPd_urifK-Umip-5ZtMTj91WaJ7CfQhzJ0mL9dhQhuo8Co3ma6nXqcaQN8pjzqTYbeuSVCjidLKzXFY7wcgI6Qydd6rBSe-T3I6_ikcXuz1b18CfoJLO2uljD_eH7D2oq1qkszNN-8rFduULdb6KirNxFkCr5A"},"systemID":"1314839386","customerID":"468145998827376034"}
    Recipient {"firstName":"Mark","lastName":"Stevenett","addr1":"686 E 110 S","addr2":"Unit 102","city":"American Fork","state":"UT","postalCode":"84003-2868","country":"US"}
    Card {"idPK":"728145998864957897","number":"7CC92D0B83DAC18D","type":{"code":"VISA","value":"VI"},"cardExpiryDate":"2026-12-28","nameOnCard":"Christian Torres","id":"728145998864957897"}
   */
  var product = {
      amount: 1
      , tax: charges.taxes
      , shipping: charges.shippingTotal
      , sku: item.productSku
      , name: item.skuName
      , price: charges.item
      , deliveryDate: moment(deliveryDate).format('DD-MMM-YY').toUpperCase()
      , total: charges.total
    }
  ;

  return user.submitOrder(product, address, card);
})
.then(function(order) {
  console.log('Order');
  console.log(order);
})
;

