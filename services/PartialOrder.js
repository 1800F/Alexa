'use strict';

var Flowers = require('./Flowers.js')
  , FlowersUser = Flowers.FlowersUser
  , config = require('../config')
  , _ = require('lodash')
  , moment = require('moment')
  , Promise = require('bluebird')
  , verbose = config.verbose
  , ContactBook = require('./ContactBook.js')
  , Catalog = require('./Catalog.js')
  , address = require('../skill/address.js')
;

/* TERMS
 * possibleRecipient: The name of a person the user wants to send flowers to. It's not yet validated. Always a string or null
 * recipientChoice: An offering to the user of a name that they could say. When the user says the name, it'll be a
 *                  possibleRecipient, then validated
 * contactCandidates: When the user gives us a possible recipient, and we're validating, we pick all the contacts that
 *                   are close to the possibleRecipient. Each of these is a contactCandidate.
 * recipient: The actual recipient that has been selected and validated by the user to send flowers to. This is the real deal.
 * arrangementDescriptions: When the user ask us for the arrangement's descriptions, we describe them to the user.
 * arrangement: The actual arrangement that has been selected by the user.
 */

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

function PartialOrder(api, data) {
  data = data || {};
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
  if(ret.contactBook) ret.contactBook = ret.contactBook.serialize();
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

PartialOrder.prototype.hasRecipient = function() {
  return !!this.recipient;
}

PartialOrder.prototype.getRecipientAddress = function() {
  return address.fromPipes(this.recipient.address);
}
//
/// ***** Recipient Choices ***** ///
// These are unique names in the user's contact book that we mention to the user
// as a prompt for who to tell us to select

PartialOrder.prototype.setupRecipientChoices = function() {
  return this.recipientChoices = {
    offset: 0,
    choices: this.contactBook.range(0,config.skill.recipientChoiceCount),
  };
}

PartialOrder.prototype.getRecipientChoices = function() {
  return this.recipientChoices.choices;
}

PartialOrder.prototype.nextRecipientChoices = function() {
  this.recipientChoices.offset += config.skill.recipientChoiceCount;
  this.recipientChoices.choices = this.contactBook.range(this.recipientChoices.offset,config.skill.recipientChoiceCount);
}

PartialOrder.prototype.isLastRecipientChoiceOffer = function() {
  return this.recipientChoices.offset + config.skill.recipientChoiceCount >= this.contactBook.contacts.length;
}

/// ***** Contact Candidates ***** ///
// These are contacts (Names & Addresses) that match the user's queries. We offer them to the user in a
// series, and they pick one that will become the final recipient.

PartialOrder.prototype.setupContactCandidates = function() {
  this.contactCandidates = {
    offset: 0,
    choices: this.contactBook.searchByName(this.possibleRecipient)
  };
}

PartialOrder.prototype.hasContactCandidate = function() {
  return this.contactCandidates && this.contactCandidates.offset < this.contactCandidates.choices.length;
}

PartialOrder.prototype.nextContactCandidate = function() {
  return this.contactCandidates.offset++;
}

PartialOrder.prototype.getContactCandidate = function() {
  return this.contactCandidates.choices[this.contactCandidates.offset];
}

PartialOrder.prototype.acceptCandidateContact = function() {
  this.recipient = this.getContactCandidate();
  //Clear out this junk just to make the session smaller
  this.possibleRecipient = null;
  this.contactCandidates = null;
  this.recipientChoices = null;
}

/// ***** Arrangement Descriptions ***** ///
/// These are the arrangement (Name & Description) that user can order. We describe them to the user
/// in a series, and they can pick one that will become the final arrangement.

PartialOrder.prototype.setupArrangementDescriptions = function() {
  this.arrangementDescriptionOffset = 0;
}

PartialOrder.prototype.hasArrangementDescription = function() {
  return this.arrangementDescriptionOffset && this.arrangementDescriptionOffset < Catalog.choices.length;
}

PartialOrder.prototype.nextArrangementDescription = function() {
  return this.arrangementDescriptionOffset++;
}

PartialOrder.prototype.getArrangementDescription = function() {
  return Catalog.choices[this.arrangementDescriptionOffset];
}

PartialOrder.prototype.acceptArrangement = function() {
  this.pickArrangement(this.getArrangementDescription().name);
  // Clear out this junk just to make the session smaller
  this.arrangementDescriptionOffset = null;
}

/// ***** Size Descriptions ***** ///
/// These are the sizes (Name & Description) that user can order for the specific arrangement.
/// We describe them to the user in serios, and they can pick one that will become the final size.

PartialOrder.prototype.setupSizeDescriptions = function() {
  this.sizeDescriptions = {
    offset: 0,
    choices: Catalog.sizesByArrangement(this.arrangement)
  };
}

PartialOrder.prototype.hasSizeDescriptions = function() {
  return this.sizeDescriptions && this.sizeDescriptions.offset < this.sizeDescriptions.choices.length;
}

PartialOrder.prototype.nextSizeDescription = function() {
  return this.sizeDescriptions.offset++;
}

PartialOrder.prototype.getSizeDescription = function() {
  return this.sizeDescriptions.choices[this.sizeDescriptions.offset];
}

PartialOrder.prototype.acceptSize = function() {
  this.pickSize(this.getSizeDescription().name);
  // Clear out this junk just to make the session smaller
  this.sizeDescriptions = null;
}

PartialOrder.prototype.pickArrangement = function(arrangementName) {
  this.arrangement = arrangementName;
}

PartialOrder.prototype.pickSize = function(sizeName) {
  this.size = sizeName;
}

PartialOrder.prototype.hasArrangement = function() {
  return !!this.arrangement;
}

PartialOrder.prototype.hasSize = function() {
  return !!this.size;
}

PartialOrder.prototype.hasDeliveryDate = function() {
  return !!this.deliveryDate;
}

PartialOrder.prototype.hasDeliveryDate = function() {
  return !!this.deliveryDate;
}

PartialOrder.prototype.getCatalogEntry = function() {
  var self = this;
  if(!this.arrangement || !this.size) return null;
  var category = _.find(Catalog.choices,function(cat){
    return cat.name.toLowerCase() == self.arrangement;
  });
  var size = _.find(category.sizes,function(size){
    return size.name.toLowerCase() == self.size.toLowerCase();
  });
  var sku = category.sku + size.suffix;

  return {
    product: Flowers.Product(config.flowers,sku),
    category: category,
    size: size
  };
}

PartialOrder.prototype.acceptPossibleDeliveryDate = function(date) {
  var self = this
    , mDate = moment(date = date || self.possibleDeliveryDate) //It's already been validated
  ;
  self.deliveryDate = mDate.toISOString();
}

PartialOrder.prototype.isDateDeliverable = function(date, product) {
  var self = this;
  return Promise.try(function(){
    var mDate = moment(date);
   //No past deliver dates allowed, but TZs are tricky, to fudge a day and let the API handle TZs.
    if(!date || !mDate.isValid || mDate.isBefore(moment().add(-1,'day'))) return false;
    product = product || self.getCatalogEntry();
    return product.product.getDeliveryCalendar(self.getRecipientAddress().zip,null,mDate.toISOString())
    .then(function(res){
      return res.getDlvrCalResponse.responseStatus == 'SUCCESS';
    })
  });
}

PartialOrder.prototype.findDeliveryDateOffers = function(date) {
  var self = this;
  return Promise.try(function(){
    var mDate = moment(date)
      , product = self.getCatalogEntry()
      , options = [];
    if(!mDate.isValid || mDate.isBefore(moment().add(-1,'day'))) options = [moment().add(1,'day'),moment().add(2,'day')];
    else options = [moment(mDate).add(-1,'day'), moment(mDate).add(1,'day')];
    if(verbose) console.log('Offering alternative dates: ', options.map(function(d){ return d.format('YYYY-MM-DD'); }))

    return Promise.all(options.map(function(date){ return self.isDateDeliverable(date,product); }))
    .then(function(valids){
      self.deliveryDateOffers = _(options)
        .zip(valids)
        .filter('1')
        .map(function(d){ return d[0].toISOString(); })
        .value();
      return self.deliveryDateOffers;
    });
  });
}

PartialOrder.prototype.prepOrderForPlacement = function(){
  // 0. Get Product prices
  // 1. Get Recipient Address
  // 2. Get Shipping prices
  // 3. Get Tax information
  // 4. Aggregate prices
  // 5. Select payment method
  //
  var productPrice = self.arrangement.price
    , purchase = Flowers.Purchase(config.flowers)
  ;
  return Promise.all([
    this.user.getRecipientAddress(self.recipient.demoId,self.recipient.id),
    purchase.login() //TODO Reuse the auth token found in Flowers by extending the scope to include purchasing
  ])
  .spread(function(address){
    return purchase.getShipping({
      productSku: self.arrangement.sku,
      productSku: self.arrangement.prodType,
      itemPrice: self.arrangement.price,
    },address,self.deliveryDate);
  }).then(function(shipping){

  })
    login: login,
    getShipping: getLogicalOrderShippingCharge,
    getOrderNumber: getNextOrderNumber,
    getTaxes: getTaxes,
    tokenizeCC: tokenizeCC,
    authorizeCC: authorizeCC,
    createOrder: createOrderObject,

}

PartialOrder.prototype.placeOrder = function(){
  //0. Get order Number
  //1. Authorize CC
  //2. create order
}


