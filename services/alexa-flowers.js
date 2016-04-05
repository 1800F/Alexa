'use strict';

var Promise = require('bluebird')
  , _ = require('lodash')
  , Flowers = require('./Flowers.js')
  , url = require('url')
  , _ = require('lodash')
  , path = require('path')
  , moment = require('moment')
;

var ERRORS = exports.ERRORS = _(['CARD', 'PAYMENTMETHOD', 'MOPHISTORY']).map(function (x) {
  return [x, x];
}).fromPairs().value()
;

/*
 * Returns a promise of an array of errors. An empty array means the users validates for the Alexa.
 * Errors are entries in AlexaFlowers.ERRORS
 */
exports.validate = function (flowersUser) {
  return flowersUser.authenticate().then( function (authenticateUser) {
    var systemID = authenticateUser.authenticateCustomerResponse.customerData.systemID;
    return flowersUser.getCustomerDetails(systemID).then( function (userProfile) {
      var customerId = userProfile.customerId;
      return Promise.all([
        flowersUser.getPaymentMethods(systemID)
       ,flowersUser.getRecipients(customerId)
      ]).spread(function (paymentMethods, recipients) {
       var noCC = !exports.pickCard(paymentMethods)
          , noBillingAddress =!userProfile.address
          , noContacts = !recipients|| recipients.length < 1
        ;

        return {
          systemID: systemID,
          customerID: customerId,
          noCC: noCC,
          noContacts: noContacts,
          noBillingAddress: noBillingAddress
        };
      });
    });

  });
};

exports.pickCard = function (cards) {
  return _.find(cards,function(card){
    return moment(card.cardExpiryDate).isSameOrAfter(moment()) && !cardBlackList[card.id];
  });
};

var cardBlackList = {
  '510145981460446452': true,
  '761145982066627277': true
};
