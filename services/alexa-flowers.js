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
}).fromPairs().value(),
    BUCKET = 'settings';

exports.setPaymentMethodId = function (flowersUser, paymentId) {
  return flowersUser.setAccountSetting(BUCKET, 'paymentMethodId', paymentId).catch(function (e) {
    return 'Failed to set payment method';
  });
};

exports.getPaymentMethodId = function (flowersUser) {
  return flowersUser.getAccountSetting(BUCKET, 'paymentMethodId').then(function (obj) {
    return obj.value;
  }).catch(function (e) {
    return 'Failed to get payment method';
  });
};

/* 
 * Returns a promise of an array of errors. An empty array means the users validates for the Alexa.
 * Errors are entries in AlexaFlowers.ERRORS
 */
exports.validate = function (flowersUser) {
  return Promise.all([flowersUser.authenticate()]).spread(function (primaryCard) {
    var _ref;
    process.stdout.write('Validate Reached:\r');

    var errors = [];
    if (!primaryCard) errors.push(ERRORS.CARD);
    
    return _ref = {
      card: primaryCard,
      }, _defineProperty(_ref, 'errors', errors), _ref;
  });
};

exports.pickCardImage = function (cardImages, type) {
  var img = _.find(cardImages, { imageType: type });
  if (!img) return null;
  return normalizeCardUrl(img.uri);
};
exports.isValidPaymentMethod = function (method) {
  var now = new Date(),
      nowYear = now.getFullYear(),
      nowMonth = now.getMonth() + 1;
  return method.expirationYear > nowYear || method.expirationYear == nowYear && method.expirationMonth >= nowMonth;
};

exports.getBalance = function (user) {
  return user.getPrimaryCard().then(function (card) {
    return user.getCardBalanceRealTime(card.cardId);
  });
};

function normalizeCardUrl(uri) {
  var puri = url.parse(uri);
  if (puri.host == 'test.openapi.starbucks.com') return 'https://globalassets.starbucks.com/images/cardimages/' + path.basename(puri.path);
  return uri.format();
}

exports.getReloadAmount = function (currentBalance, desiredCharge) {
  var gap = 500;
  var needCents = Math.round((desiredCharge - currentBalance) * 100);
  if (needCents <= 0) return 0;
  var mod = needCents % gap,
      to5 = mod == 0 ? 0 : gap - mod,
      toReload = Math.round(needCents + to5) / 100;
  ;
  return Math.max(10, toReload);
};