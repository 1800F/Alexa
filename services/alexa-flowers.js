'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Promise = require('bluebird'),
    _ = require('lodash'),
    Flowers = require('./Flowers.js'),
    url = require('url'),
    _ = require('lodash'),
    path = require('path');

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
    process.stdout.write('authenticateError: ' + authenticateUser.authenticateCustomerResponse.error + "\rauthenticateSystemID: " + systemID + "\r");
    return flowersUser.getProfile(systemID).then( function (userProfile) {
      var customerID = userProfile.Get18FCustomerByAdminSysKeyResponse.result.response.idPK;
      process.stdout.write("customerID: " + customerID + "\r");
      return Promise.all([flowersUser.getPaymentMethods(systemID), flowersUser.getRecipients(customerID)
      ]).spread(function (paymentMethods, recipients) {
        var _ref;
        process.stdout.write('Validate Reached:\r');
        console.log("PAYMENT METHODS: " + JSON.stringify(paymentMethods));
        console.log("payment length: " + JSON.stringify(paymentMethods.GetSavedCardsForCustomerResponse.result.response));
        console.log("CONTACTS: " + JSON.stringify(recipients));

        var errors = [], noCC = false, noContacts = false;
        //Check to see if there are valid payment methods
        if (!paymentMethods || !paymentMethods.GetSavedCardsForCustomerResponse || !paymentMethods.GetSavedCardsForCustomerResponse.result || !paymentMethods.GetSavedCardsForCustomerResponse.result.response || paymentMethods.GetSavedCardsForCustomerResponse.result.response.financialProfile.chargeCard.length < 1 ) {
          //errors.push(ERRORS.CARD);
          noCC = true;
        }
        //Check to see if there are recipients
        if (!recipients|| recipients.length < 1) {
          //errors.push(ERRORS.CARD);
          noContacts = true;
        }

        return _ref = {
          systemID: systemID,
          customerID: customerID,
          noCC: noCC,
          noContacts: noContacts
          }, _defineProperty(_ref, 'errors', errors), _ref;
      });
    });

  });

};

exports.isValidPaymentMethod = function (method) {
  var now = new Date(),
      nowYear = now.getFullYear(),
      nowMonth = now.getMonth() + 1;
  return method.expirationYear > nowYear || method.expirationYear == nowYear && method.expirationMonth >= nowMonth;
};
