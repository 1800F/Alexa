/**
 * Copyright (C) Crossborders LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Variables use with responses.
 *
 * Written by Christian Torres <christiant@rain.agency>, March 2016
 */

'use strict';

var _ = require('lodash'),
    Promise = require('bluebird'),
    lang = require('./lang.js'),
    currency = require('./currency.js'),
    moment = require('moment'),
    phonetic = require('./phonetic.js'),
    _ = require('lodash'),
    address = require('./address.js')
    ;

exports.userName = function (po) {
  if(!po) return '';
  return po.getProfile().then(function (profile) {
    return profile.name;
  })
};

// Recipients

exports.recipientChoices = function (po) {
  var choices = po.getRecipientChoices();
  return lang.enumerate(_.map(choices,'name'));
};

exports.numberOfRecipientsLeft = function (po) {
  return '';
};

exports.contactCandidateName = function (po) {
  var candidate = po.getContactCandidate();
  return _.compact([candidate.firstName, candidate.lastName]).join(' ');
};

exports.contactCandidateAddress = function (po) {
  return address.say(address.fromPipes(po.getContactCandidate().address));
};

// Arrangement sizes

exports.largePrice = function (po) {
  var price = po.getSizePriceByName('large');
  return currency.sayInBlocks(price);
};

exports.mediumPrice = function (po) {
  var price = po.getSizePriceByName('medium');
  return currency.sayInBlocks(price);
};

exports.smallPrice = function (po) {
  var price = po.getSizePriceByName('small');
  return currency.sayInBlocks(price);
};

// To Review Order

exports.arrangementSize = function (po) {
  return po.size;
};

exports.arrangementType = function (po) {
  return po.arrangement.name;
};

exports.recipient = function (po) {
  return _.compact([po.recipient.firstName, po.recipient.lastName]).join(' ');
};

exports.possibleRecipient = function (po) {
  return po.possibleRecipient;
};

exports.deliveryDate = function (po) {
  return '';
};

// Query arrangement, size

exports.arrangementDescription = function(po) {
  var arrangement = po.getArrangementDescription();
  return arrangement.description;
};

exports.arrangementName = function(po) {
  var arrangement = po.getArrangementDescription();
  return arrangement.name;
}

exports.sizeDescription = function (po) {
  var size = po.getSizeDescription();
  return size.description;
}

exports.sizeName = function (po) {
  var size = po.getSizeDescription();
  return size.name;
};

exports.sizePrice = function (po) {
  var price = po.getSizePrice();
  return currency.say(price, 'USD');
}

// OKay

exports.okay = function (po) {
  return _.sample([
    'Okay',
    'Great',
    'Excellent'
  ]);
};

// Confirm

exports.address = function (po) {
  return '';
};

exports.price = function (po) {
  return '';
};

exports.date = function (po) {
  return '';
};

exports.dateMinusOne = function (po) {
  return '';
}

exports.datePlusOne = function (po) {
  return '';
}

exports.nextDate = function (po) {
  return '';
}

exports.paymentType = function (po) {
  return '';
}
