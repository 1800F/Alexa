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

exports.setPaymentMethodId = function (starbucksUser, paymentId) {
  return starbucksUser.setAccountSetting(BUCKET, 'paymentMethodId', paymentId).catch(function (e) {
    return 'Failed to set payment method';
  });
};

exports.getPaymentMethodId = function (starbucksUser) {
  return starbucksUser.getAccountSetting(BUCKET, 'paymentMethodId').then(function (obj) {
    return obj.value;
  }).catch(function (e) {
    return 'Failed to get payment method';
  });
};

/* Returns a promise of an array of errors. An empty array means the users validates for the Alexa.
 * Errors are entries in AlexaStarbucks.ERRORS
 */
exports.validate = function (starbucksUser) {
  return Promise.all([starbucksUser.getPrimaryCard(), starbucksUser.getPaymentMethods(), starbucksUser.getOrders() // While this logic is different than the skill, it's get's most cases, and the skill will just bounce you if you don't have valid orders
  ]).spread(function (primaryCard, paymentMethods, purchaseHistory) {
    var _ref;

    var errors = [];
    if (!primaryCard) errors.push(ERRORS.CARD);
    if (!_.some(paymentMethods, exports.isValidPaymentMethod)) errors.push(ERRORS.PAYMENTMETHOD);
    if (!purchaseHistory.orderHistoryItems.length) errors.push(ERRORS.MOPHISTORY);
    return _ref = {
      card: primaryCard,
      paymentMethods: paymentMethods }, _defineProperty(_ref, 'paymentMethods', paymentMethods), _defineProperty(_ref, 'errors', errors), _ref;
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