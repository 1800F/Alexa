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
    address = require('./address.js'),
    images = require('./images.json')
    ;

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

exports.deliveryDateOffers = function(po) {
  return lang.enumerateOr(po.deliveryDateOffers.map(function(date){
    return moment(date).format('MMMM Do');
  }))
}

// Arrangement sizes

exports.largePrice = function (po) {
  var details = po.getSizeDetailsByName('large');
  return currency.sayInBlocks(details.price);
};

exports.mediumPrice = function (po) {
  var details = po.getSizeDetailsByName('medium');
  return currency.sayInBlocks(details.price);
};

exports.smallPrice = function (po) {
  var details = po.getSizeDetailsByName('small');
  return currency.sayInBlocks(details.price);
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
  return moment(po.deliveryDate).format('MMMM Do');
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
  var details = po.getSizeDetailsByName(po.getSizeDescription().name);
  return currency.say(details.price, 'USD');
}

exports.differentSize = function (po) {
  var size = po.getSizeName();
  if (size.toLowerCase() === "medium") return "Large";
  return "Medium";
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
  var addr = po.getRecipientAddress();
  var addressString = addr.line1 + "\n";
  if (addr.line2) addressString += (addr.line2 + "\n");
  if (addr.line3) addressString += (addr.line3 + "\n");
  addressString += (addr.city + ', ' + addr.state + ' ' + addr.zip);
  return addressString;
};

exports.price = function (po) {
  return currency.say(po.order.charges.total,'USD');
};

exports.priceTextFormatted = function (po) {
  return '$' + po.order.charges.total.toFixed(2);
}

exports.possibleDeliveryDate = function (po) {
  return moment(po.possibleDeliveryDate).format('MMMM Do');
};

exports.paymentType = function (po) {
  return po.order.card.type.code;
}

exports.imageUrl = function (po) {
  var url = po.getWeb() || '';
  return url + images[po.arrangement.name.toLowerCase()];
};

exports.welcomePhrase = function (po) {
  var welcomePhrase = !po.hasSaidWelcome ? 'Hi there!' : '';
  po.hasSaidWelcome = true;
  return welcomePhrase;
}
