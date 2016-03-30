'use strict';

var Flowers = require('./Flowers.js')
  , FlowersUser = Flowers.FlowersUser
  , config = require('../config')
  , _ = require('lodash')
  , moment = require('moment')
  , Promise = require('bluebird')
  , verbose = config.verbose
  , ContactBook = require('./ContactBook.js')
;

// Mostly used for testing
exports.fromData = function (api, data) {
  return new PartialOrder(api || {}, data);
};

// Builds the PO from state stored in the session
exports.fromRequest = function (api, request) {
  //console.log('Initializing po from request');
  return new PartialOrder(api, request.session.attributes.partialOrder);
};

// Makes a new PO with nothing in it
exports.empty = function (api) {
  return new PartialOrder(api, {});
};

// Makes a new PO and populates with the starting point order information
exports.build = function (api) {
  var po = new PartialOrder(api);
  return po.build();
};

function PartialOrder(api, data) {
  this.q = {};
  _.assign(this, api);
  _.assign(this, data);
  if(data.contactBook) this.contactBook = ContactBook.fromData(api,data.contactBook);
}

PartialOrder.prototype.getFlag = function (name) {
  if (!this.flags) return null;
  return this.flags[name];
};

PartialOrder.prototype.setFlag = function (name, value) {
  this.flags = this.flags || {};
  this.flags[name] = value;
};

PartialOrder.prototype.serialize = function () {
  var ret = _.omit(this, 'user', 'q', 'pruned', 'user', 'flowers', 'analytics');
  if (ret.history) delete ret.history.lastPull;
  if (ret.items) _.forEach(ret.items, function (item) {
    delete item.q;
  });
  ret.contactBook = ret.contactBook.serialize();
  return ret;
};

PartialOrder.prototype.getContactBook = function() {
  var self = this;
  if(self.contactBook) return Promise.resolve(self.contactBook);
  return self.q.contactBook = (self.q.contactBook || self.user.getRecipients(self.user.customerID).then(function(contacts){
    self.contactBook = ContactBook.fromContacts({user: self.user, flowers: self.flowers},contacts);
    return self.contactBook;
  }));
}

PartialOrder.prototype.IsPossibleRecipientInAddressBook = function() {
  var self = this;
  if(!self.possibleRecipient) return false
    // Getting matching first names and sort it
  self.possibleRecipients = self.contacts.filter(function(c) {
    return new RegExp('^' + self.possibleRecipient, 'i').test(c.FirstName);
  }).sort(function(a,b) {
    if (a.FirstName > b.FirstName) return 1;
    if (a.FirstName < b.FirstName) return -1;
    if (a.LastName > b.LastName) return 1;
    if (a.LastName < b.LastName) return -1;
    return 0;
  });

  return (self.possibleRecipients.length > 0);
}

PartialOrder.prototype.hasRecipient = function() {
  return !!this.recipient;
}
PartialOrder.prototype.hasArrangement = function() {
  return !!this.arrangement;
}

PartialOrder.prototype.hasSize = function() {
  return !!this.size;
}

PartialOrder.prototype.setupRecipientChoices = function() {
  return this.recipientChoices = {
    offset: 0,
    choices: self.contactBook.range(0,config.skill.recipientChoiceCount),
  };
}

PartialOrder.prototype.nextRecipientChoices = function() {
  this.recipientChoices.offset += config.skill.recipientChoiceCount;
  this.recipientChoices.choices = self.contactBook.range(this.recipientChoices.offset,config.skill.recipientChoiceCount);
}

PartialOrder.prototype.isLastRecipientChoiceOffer = function() {
  return this.recipientChoices.offset + config.skill.recipientChoiceount >= this.contactBook.contacts.length;
}

PartialOrder.prototype.pickArrangement = function(arrangementName) {
  this.arrangement = arrangementName;
}

PartialOrder.prototype.pickSize = function(sizeName) {
  this.size = sizeName;
}
