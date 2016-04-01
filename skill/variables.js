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

exports.deliveryDateOffers = function(po) {
  return lang.enumerateOr(po.deliveryDateOffers.map(function(date){
    return moment(date).format('MMMM Do');
  }))
}

// Arrangement sizes

exports.largePrice = function (po) {
  return '';
};

exports.mediumPrice = function (po) {
  return '';
};

exports.smallPrice = function (po) {
  return '';
};

// To Review Order

exports.arrangementSize = function (po) {
  return po.size;
};

exports.arrangementType = function (po) {
  return po.arrangement;
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

exports.arrangement = function (po) {
  return '';
}

exports.sizeDescription = function (po) {
  return '';
}

exports.size = function (po) {
  return '';
};

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
