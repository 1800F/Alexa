'use strict';

var alexaFlowers = require('./alexa-flowers.js'),
    Flowers = require('./Flowers.js'),
    FlowersUser = Flowers.FlowersUser,
    config = require('../config'),
    _ = require('lodash'),
    moment = require('moment'),
    Promise = require('bluebird'),
    verbose = config.verbose;

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
  return ret;
};

PartialOrder.prototype.getContacts = function() {
  var self = this;
  if(self.contacts) return self.contacts;
  return self.q.contacts = (self.q.contacts || self.user.getRecipients(self.user.customerID).then(function(contacts){
    console.log('Contacts',contacts)
    self.contacts = contacts;
  }));
}

PartialOrder.prototype.hasRecipient = function() {
  return !!this.recipient;
}

PartialOrder.prototype.hasContacts = function() {
  return !!this.contacts.length;
}

PartialOrder.prototype.pickArrangement = function(arrangmentName) {
}

PartialOrder.prototype.pickSize = function(sizeName) {
}
