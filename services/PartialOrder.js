'use strict';

var alexaStarbucks = require('./alexa-starbucks.js'),
    Starbucks = require('./Flowers.js'),
    StarbucksUser = Starbucks.StarbucksUser,
    config = require('../config'),
    _ = require('lodash'),
    moment = require('moment'),
    Promise = require('bluebird'),
    verbose = config.verbose,
    zipToTZ = require('../services/zip-to-tz.js');

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

/* Returns a promise of 4 different possibilities.
 * 1) Null. No valid previous order could be found.
 * 2) items & store. We got a valid previous order. Yay!
 * 3) items & no store. The item works, but has not good stores. Go to detached mode
 * 4) items & store & fallback. We had to fall back
 *
{
  items: [{
    quantity: NUMBER,
    commerce: { sku: STRING },
    productType: NUMBER,
    name: STRING, // What this product is called (by SKU)
  }],
  history: {
    offset: NUMBER //How far we've paged into prior order history
    lastPull: {} // The last store we've pulled. This value is NOT persisted
    seenStores: {}, // Set of all stores that we've encountered before from paging through history
  },
  store: storeNumber
  fallback: {
    original: [],
    reason: why,
  },
  isDetached: BOOLEAN,
  profile: {},
  balance: {},
  pricing: {},
  pruned: [], //Items deemed unavailable
  flags: {},
  q: {} //Set of promises that are getting data
}
 */
function PartialOrder(api, data) {
  this.q = {};
  _.assign(this, api);
  _.assign(this, data);
  this.history = this.history || {
    offset: -1,
    seenStores: {}
  };
}

PartialOrder.prototype.getFlag = function (name) {
  if (!this.flags) return null;
  return this.flags[name];
};

PartialOrder.prototype.setFlag = function (name, value) {
  this.flags = this.flags || {};
  this.flags[name] = value;
};

PartialOrder.prototype.validateAndEditOrder = function () {
  var user = this.user,
      po = this;
  return getProductAvailability(po.starbucks, po.store, po.items).then(function (prdAvailability) {
    po.items = prdAvailability.availables;
    po.pruned = prdAvailability.unavailables;
    return {
      anyRemoved: !!prdAvailability.unavailables.length
    };
  });
};

PartialOrder.prototype.startOrderAdjust = function (cardId) {
  var self = this;
  self.orderAdjust = {
    savedItems: _.cloneDeep(self.items),
    removedItems: [],
    cursor: 0
  };
};

PartialOrder.prototype.revertOrderAdjust = function (cardId) {
  var self = this;
  self.analytics.event('Main Flow', 'Revert Order Adjustments').send();
  self.items = self.orderAdjust.savedItems;
  this.startOrderAdjust();
};

PartialOrder.prototype.commitOrderAdjust = function (cardId) {
  var self = this,
      removed = self.orderAdjust.removedItems;
  self.analytics.event('Main Flow', 'Accept Order Adjustments', 'Removed Count', removed.length).event('Main Flow', 'Accept Order Adjustments', 'Retained Count', self.items.length).send();
  delete self.orderAdjust;
};

PartialOrder.prototype.hasMoreOrderAdjustItem = function (cardId) {
  var self = this;
  return self.items.length > self.orderAdjust.cursor;
};

PartialOrder.prototype.nextOrderAdjustItem = function (cardId) {
  var self = this;
  self.orderAdjust.cursor++;
};

PartialOrder.prototype.hasOrderChangedInOrderAdjust = function (cardId) {
  var self = this;
  return !!self.orderAdjust.removedItems.length;
};

PartialOrder.prototype.currentOrderAdjustItemIsForced = function (cardId) {
  var self = this;
  return self.items.length == 1 && self.orderAdjust.cursor == 0;
};

PartialOrder.prototype.removeAndNextOrderAdjustItem = function (cardId) {
  var self = this,
      removed = self.items.splice(self.orderAdjust.cursor, 1);
  self.analytics.event('Main Flow', 'Item Removed', 'SKU', removed[0].commerce.sku).send();
  self.orderAdjust.removedItems = self.orderAdjust.removedItems.concat(removed);
  //We don't change the cursor, because it's implicitly moved forward by removing an item
};

PartialOrder.prototype.getOrderAdjustRemovedItems = function (cardId) {
  var self = this;
  return self.orderAdjust.removedItems || [];
};

PartialOrder.prototype.getOrderAdjustItem = function (cardId) {
  var self = this;
  return self.items[self.orderAdjust.cursor];
};

PartialOrder.prototype.startLocAdjust = function (altStores) {
  var self = this;

  return (altStores ? Promise.resolve(altStores) : getStoreAlternatives(this)).then(function (stores) {
    if(self.store) stores = _.without(stores,self.store).concat([self.store]) //Re-order stores so that the current store is last
    if(verbose) console.log('Alternative stores are:',stores)
    self.locAdjust = {
      stores: stores,
      cursor: 0
    };
    return stores;
  });
};

PartialOrder.prototype.hasMoreLocAdjustLocs = function () {
  var self = this;
  return self.locAdjust.stores.length > self.locAdjust.cursor;
};

PartialOrder.prototype.isOnLastLocAdjustLoc = function () {
  var self = this;
  return self.locAdjust.cursor == self.locAdjust.stores.length - 1;
};

PartialOrder.prototype.nextLocAdjustLoc = function () {
  var self = this;
  self.locAdjust.cursor++;
};

PartialOrder.prototype.getLocAdjustLoc = function () {
  var self = this;
  return self.locAdjust.stores[self.locAdjust.cursor];
};

PartialOrder.prototype.acceptLocAdjust = function () {
  var self = this,
      prevStore = self.store;
  self.store = self.locAdjust.stores[self.locAdjust.cursor];
  self.analytics.event('Main Flow', 'Location Changed', 'Changed To', self.store).event('Main Flow', 'Location Changed', 'Changed From', prevStore).send();
  self.locAdjust = null;
};

PartialOrder.prototype.discardLocAdjust = function () {
  var self = this;
  self.locAdjust = null;
};

PartialOrder.prototype.planReload = function (cardId) {
  var self = this;
  return this.getBalance(cardId).then(function (balance) {
    self.pricing.reloadAmount = alexaStarbucks.getReloadAmount(balance.balance, self.pricing.totalAmount);
  });
};

PartialOrder.prototype.reloadAndOrder = function () {
  var self = this,
      user = self.user;
  self.analytics.event('Main Flow', 'Reload', 'Reload Amount', self.pricing.reloadAmount).send();
  return Promise.all([user.getPrimaryCard(), alexaStarbucks.getPaymentMethodId(user)]).spread(function (cardData, paymentId) {
    return user.reloadCard(cardData.cardId, self.pricing.reloadAmount, paymentId).then(function () {
      return self.placeOrder(cardData);
    });
  });
};

PartialOrder.prototype.clearBalance = function () {
  this.q.balance = null;
  this.balance = null;
};

PartialOrder.prototype.placeOrder = function (cardData) {
  var user = this.user,
      po = this;

  return (cardData ? Promise.resolve(cardData) : user.getPrimaryCard()).then(function (cardData) {
    return user.submitOrder(po.store, po.pricing.orderToken, cardData.cardId, po.pricing.totalAmount, po.pricing.signature).then(function (orderSuccess) {
      po.pickup = orderSuccess.serviceTime;
      po.clearBalance();
      po.analytics.event('Main Flow', 'Order Placed').send();

      var trans = po.analytics.transaction(po.pricing.orderToken, po.pricing.totalAmount, po.pricing.taxAmount);
      po.items.forEach(function (item) {
        return trans = trans.item(item.price, item.quantity, item.commerce.sku, item.name);
      });
      trans.send();

      return po.getBalance(cardData.cardId).then(function () {
        return true;
      });
    }).catch(function (err) {
      if (verbose) console.log('Error placing order', err.body);
      if (err.statusCode && err.statusCode == 400 && err.body && err.body.code == Starbucks.ERROR_CODES.InsufficientBalance) {
        return po.planReload(cardData.cardId).then(function () {
          return false;
        });
      }
      throw err;
    });
  });
};
//
//Fetches store names. Caches the store name in history.seenStores
PartialOrder.prototype.getBalance = function (cardId) {
  var self = this,
      user = self.user;
  return self.q.balance = self.q.balance || Promise.try(function () {
    if (self.balance) return self.balance;
    return (cardId ? Promise.resolve({ cardId: cardId }) : user.getPrimaryCard()).then(function (card) {
      return self.user.getCardBalanceRealTime(card.cardId);
    }).then(function (data) {
      var balance = {
        balance: data.balance,
        currencyCode: data.balanceCurrencyCode
      };
      self.balance = balance;
      return balance;
    });
  });
};

//Fetches store names. Caches the store name in history.seenStores
PartialOrder.prototype.getStoreData = function (storeNumber) {
  var self = this;
  self.q.stores = self.q.stores || {};
  return self.q.stores[storeNumber] = self.q.stores[storeNumber] || Promise.try(function () {
    var storeData = self.history.seenStores[storeNumber];
    if (storeData && _.isObject(storeData)) return storeData;
    //TODO Cache this
    return self.starbucks.getStoreByNumber(storeNumber).then(function (data) {
      var storeData = {
        name: data.address.streetAddressLine1,
        address: data.address,
        availability: parseStoreAvailability(data)
      };
      self.history.seenStores[storeNumber] = storeData;
      return storeData;
    });
  });
};

PartialOrder.prototype.getPricing = function () {
  var self = this;
  return self.q.getPricing = self.q.getPricing || Promise.try(function () {
    var pricing = self.pricing;
    if (pricing) return pricing;
    return self.user.getOrderStore(self.store, self.items).then(function (data) {
      var pricing = _.assign({
        signature: data.signature,
        orderToken: data.orderToken,
        currencyCode: data.store.localCurrencyCode
      }, data.summary);
      self.pricing = pricing;
      _.forEach(data.cart.items, function (item, i) {
        return self.items[i].price = item.price;
      });
      return pricing;
    });
  });
};

PartialOrder.prototype.getProfile = function () {
  var self = this;
  return self.q.getProfile = self.q.getProfile || Promise.try(function () {
    var profile = self.profile;
    if (profile) return profile;
    return self.user.getProfile().then(function (data) {
      var profile = {
        name: data.user.firstName || data.user.lastName,
        timeOfDay: getTimeOfDay(_(data.addresses).map('postalCode').compact().first())
      };
      self.profile = profile;
      return profile;
    });
  });
};
//
// Fetches product pronunciation. Mutates each item to add pronunciation
PartialOrder.prototype.getProductNames = function (items) {
  var self = this,
      items = items || this.items;
  if (!items) console.log('No items!!!', self);
  return Promise.all(items.map(getProductName));

  function getProductName(item) {
    //TODO Cache all of this in a very long term cache
    if (item.name) return Promise.resolve(item.name);
    item.q = item.q || {};
    return item.q.prodDetails = item.q.prodDetails || self.starbucks.getProductBySku(item.commerce.sku, item.productType).then(function (productDetails) {
      var name = productDetails.skuName;
      item.name = name;
      return name;
    });
  }
};

PartialOrder.prototype.serialize = function () {
  var ret = _.omit(this, 'user', 'q', 'pruned', 'user', 'starbucks', 'analytics');
  if (ret.history) delete ret.history.lastPull;
  if (ret.items) _.forEach(ret.items, function (item) {
    delete item.q;
  });
  return ret;
};

PartialOrder.prototype.seeStore = function (storeNumber) {
  this.history.seenStores[storeNumber] = true;
};

PartialOrder.prototype.hasNoItems = function () {
  return !this.items || !this.items.length;
};

PartialOrder.prototype.hasMultipleItems = function () {
  return this.items && this.items.length > 1;
};

PartialOrder.prototype.enterDetachedMode = function (order) {
  if (verbose) console.log('Store not available. Going detached');
  var self = this;
  _.assign(self, order, { mode: 'detached' });

  return getStoreAlternatives(this).then(function (stores) {
    if (!stores.length) {
      var seenStores = _.keys(self.history.seenStores);
      return Promise.all([
        Promise.all(seenStores.map(function (store) { return getStoreAvailability(store, self); }))
        , self.getProductNames()])
      .spread(function (storeAvailability, names) {
        if (verbose) console.log('store avail', storeAvailability);
        var allHours = storeAvailability.every(function (avail) {
          return !avail.isOpen && 'hours' == avail.closedDueTo;
        }),
            allInactive = storeAvailability.every(function (avail) {
          return !avail.isOpen && 'inactive' == avail.closedDueTo;
        });
        self.pruned = self.items;
        console.log('Why', allHours, allInactive);
        self.noStoreAvailableExplanation = {
          reason: allHours ? 'closed' : allInactive ? 'inactive' : 'no-fit',
          myStore: storeAvailability[seenStores.indexOf(self.store)]
        };
        return self;
      });
    } else {
      self.analytics.event('Main Flow', 'Order Started').send();
      return self.startLocAdjust(stores).then(function () {
        return self;
      });
    }
  });
};

PartialOrder.prototype.enterFallbackMode = function (firstFoundHistoricalOrder, order) {
  if (verbose) console.log('Entering fallback mode');
  _.assign(this, order, { mode: 'fallback', fallback: { originalOrder: order } });
  var partialOrder = this,
      qUnavailableExplanation = explainOrderUnavailability(partialOrder.starbucks, order.items).then(function (explanations) {
    if (verbose) console.log('Unavailable explanations', explanations);
    if (explanations.some(function (x) {
      return x == 'seasonal';
    })) partialOrder.fallback.explanation = 'seasonal';else if (explanations.every(function (x) {
      return x == 'permanent';
    })) partialOrder.fallback.explanation = 'permanent';else partialOrder.fallback.explanation = 'temporary';
  }),
      qOrdernames = this.getProductNames(this.fallback.originalOrder.items),
      firstFoundHistoricalOrder = null;
  // 1) Explain why it's unavailable
  // 2) Keep scanning
  return scan().then(function () {
    return Promise.all([qUnavailableExplanation, qOrdernames]).then(function () {
      return partialOrder;
    });
  });

  function scan() {
    if (verbose) console.log('Scanning for next order in fallback');
    return nextHistoricalOrder(partialOrder).then(function (historicalOrder) {
      firstFoundHistoricalOrder = firstFoundHistoricalOrder || historicalOrder;
      if (isNoMore(historicalOrder)) return partialOrder.enterNoneFoundMode(transHistoricalOrderToOrder(firstFoundHistoricalOrder));
      if (isIgnorableHistoricalOrder(historicalOrder)) {
        if (verbose) console.log('Order is ignorable', summarizeOrder(transHistoricalOrderToOrder(historicalOrder)));
        return scan();
      }
      var order = transHistoricalOrderToOrder(historicalOrder);
      return getProductAvailability(partialOrder.starbucks, order.store, order.items).then(function (prdAvailability) {
        if (!prdAvailability.anyAvailable) return scan();
        partialOrder.analytics.event('Main Flow', 'Order Started').send();
        _.assign(partialOrder, order);
      });
    });
  }
};

PartialOrder.prototype.enterNoneFoundMode = function (order) {
  _.assign(this, order, { mode: 'none-found' });
  return this;
};

PartialOrder.prototype.enterFoundOrderMode = function (order) {
  _.assign(this, order, { mode: 'order-found' });
  this.analytics.event('Main Flow', 'Order Started').send();
  return this;
};

//THIS PULLS ALL INFORMATION INTO THE PARTIAL ORDER
//FOR 1800 FLOWERS, WE WILL PULL THE CONTACTS LIST AND THE LIST OF CREDIT CARDS
PartialOrder.prototype.build = function () {
  var partialOrder = this,
      user = partialOrder.user,
      firstFoundHistoricalOrder = null;
  return scan();

  function scan() {
    if (verbose) console.log('Scanning for next order');
    return nextHistoricalOrder(partialOrder).then(function (historicalOrder) {
      firstFoundHistoricalOrder = firstFoundHistoricalOrder || historicalOrder;
      if (isNoMore(historicalOrder)) return partialOrder.enterNoneFoundMode(transHistoricalOrderToOrder(firstFoundHistoricalOrder));
      if (isIgnorableHistoricalOrder(historicalOrder)) {
        if (verbose) console.log('Order is ignorable', summarizeOrder(transHistoricalOrderToOrder(historicalOrder)));
        return scan();
      }

      var order = transHistoricalOrderToOrder(historicalOrder);
      return getStoreAvailability(historicalOrder.inStoreOrder.storeNumber, partialOrder).then(function (strAvailablility) {
        if (verbose) console.log('Store availbility: ', strAvailablility);
        if (!strAvailablility.isOpen) {
          return partialOrder.enterDetachedMode(order);
        }
        //TODO: We need a way to cache product availability by store
        return getProductAvailability(partialOrder.starbucks, order.store, order.items).then(function (prdAvailability) {
          if (!prdAvailability.anyAvailable) return partialOrder.enterFallbackMode(firstFoundHistoricalOrder, order);
          return partialOrder.enterFoundOrderMode(order);
        });
      });
    });
  }
};

/*
 * Finds a list of stores that it's possible to order at least some of the items at.
 */
function getStoreAlternatives(po) {
  // We'll try N stores. That doesn't mean N stores will work
  var alternativeStores = config.skill.alternativeStores;
  return pullAnotherStore();

  function pullAnotherStore() {
    var stores = _.keys(po.history.seenStores);
    if (stores.length >= alternativeStores) return considerStores(stores);
    return nextHistoricalOrder(po).then(function (order) {
      if (isNoMore(order)) return considerStores(stores);
      return pullAnotherStore();
    });
  }

  function considerStores(stores) {
    return Promise.all([
      Promise.all(stores.map(function (store) {return getProductAvailability(po.starbucks, store, po.items);})),
      Promise.all(stores.map(function (store) {return getStoreAvailability(store,po);})),
    ]).spread(function (prdAvails, storeAvails) {
      return _(prdAvails).zip(storeAvails).map(function (avail, i) {
        return avail[0].anyAvailable && avail[1].isOpen ? stores[i] : null;
      }).compact().value();
    });
  }
}

function summarizeOrder(order) {
  return JSON.stringify(order, null, 2);
}

function getStoreAvailability(storeNumber, po) {
  return po.getStoreData(storeNumber).then(function (x) {
    return x.availability;
  });
}

function transHistoricalOrderToOrder(hist) {
  if (!hist) return null;
  return {
    store: hist.inStoreOrder.storeNumber,
    items: hist.basket.items.map(transItem)
  };

  function transItem(item) {
    return {
      quantity: item.quantity,
      commerce: { sku: item.commerce.sku },
      productType: item.product.productType
    };
  }
}

function getProductAvailability(starbucks, storeNumber, items) {
  //if(verbose) console.log('getProductAvailability',storeNumber,items.length);
  return starbucks.getProductStatus(storeNumber, items).then(function (status) {
    var partition = _.partition(_.zip(items, status.items), function (zi) {
      return isPurchasable(zi[1]);
    }),
        isAvailables = _.map(status.items).map(isPurchasable),
        unavailables = partition[1];
    return {
      allAvailable: unavailables.length == 0,
      anyAvailable: unavailables.length !== status.items.length,
      isAvailables: isAvailables,
      availables: _.map(partition[0], '0'),
      unavailables: _.map(partition[1], '0')
    };
  });

  function isPurchasable(item) {
    return item.status == 'Purchasable';
  }
}

function nextHistoricalOrder(partialOrder) {
  if (partialOrder.history.pulledAll) return NoMore();
  var nextOffset = partialOrder.history.offset + 1,
      pulledAll = partialOrder.history.pulledAll,
      lastPull = partialOrder.history.lastPull,
      needsNewPull = !lastPull || nextOffset >= lastPull.paging.offset + lastPull.paging.returned,
      hasNextPull = !lastPull || lastPull.paging.hasMore,
      hasMoreItems = !lastPull || nextOffset < lastPull.paging.total;
  //if(verbose) console.log(`nextOffset: ${nextOffset}, needsNewPull ${needsNewPull} , paging ${lastPull ? JSON.stringify(lastPull.paging):null}`)
  partialOrder.history.offset++;
  if (needsNewPull && hasNextPull) {
    if (verbose) console.log('Pulling next page of history');
    return (lastPull ? lastPull.paging.next() : partialOrder.user.getOrders({ offset: nextOffset })).then(function (pull) {
      partialOrder.history.lastPull = pull;
      if (!pull.paging.total) return NoMore();
      var order = pull.orderHistoryItems[0],
          storeNumber = order.inStoreOrder.storeNumber;
      partialOrder.seeStore(storeNumber);
      return order;
    });
  } else if (!hasMoreItems) {
    if (verbose) console.log('Out of historical orders');
    return NoMore();
  } else {
    if (verbose) console.log('Moving to next in-page history item');
    var index = nextOffset - lastPull.paging.offset,
        order = lastPull.orderHistoryItems[index],
        storeNumber = order.inStoreOrder.storeNumber;
    partialOrder.seeStore(storeNumber);
    return Promise.resolve(order);
  }

  function NoMore() {
    partialOrder.history.pulledAll = true;
    return Promise.resolve(null);
  }
}

function isNoMore(historicalOrder) {
  return !historicalOrder;
}

function isIgnorableHistoricalOrder(order) {
  var isAllCoffee = !!order.basket.items.every(function (item) {
    return item.product.productType == Starbucks.PRODUCTTYPES.coffee;
  });
  return isAllCoffee;
}

function parseStoreAvailability(storeData) {
  if (storeData.xopState != 'available') return { isOpen: false, localTime: null, nextOpen: null, closedDueTo: 'inactive' };
  var today = storeData.today || { open: false, localTime: null };
  var isOpen = today.open === true,
      nextOpen = today.open ? null : !storeData.hoursNext7Days ? null : storeData.hoursNext7Days.reduce(function (memo, day) {
    return memo || (day.open ? moment(day.date).add(moment.duration(day.openTime)).format('YYYY-MM-DDTHH:mm:ss.SSS') : null);
  }, null),
      closedDueTo = isOpen ? null : nextOpen == null ? 'inactive' : storeData.operatingStatus.operating && storeData.operatingStatus.status == 'ACTIVE' ? 'hours' : 'inactive';
  return {
    isOpen: today.open === true,
    closedDueTo: closedDueTo,
    localTime: today.localTime,
    nextOpen: nextOpen
  };
}

// Skus can be unavailable b/c they're seasonal, some permanent reason( e.g. withdrawn ),
// or temporarily (a catch all for none of the above).
// We know by getting the product details and scanning for it's availability data
function explainOrderUnavailability(starbucks, items) {
  return Promise.all(_.map(items, explainItemUnavailabilty));

  function explainItemUnavailabilty(item) {
    return starbucks.getProductDetailsBySku(item.commerce.sku, item.productType).then(function (data) {
      return parseItemAvailbilityExplanation(item.commerce.sku, data);
    });
  }
}

function parseItemAvailbilityExplanation(sku, data) {
  sku = '' + sku;
  var form = data.forms.filter(function (form) {
    return _.map(form.sizes, 'commerce.sku').indexOf(sku) >= 0;
  });
  if (!form || !form.length) return 'temporary';
  form = form[0];
  if (form.availability.status == 'SeasonallyUnavailable') return 'seasonal';
  if (form.availability.status == 'Purchasable') return 'temporary'; //The product thinks it's available, but POS says you can't buy it. So we say it's a temporary issue
  return 'permanent';
}

function getTimeOfDay(zip) {
  if (!zip) return null;
  var localTime = zipToTZ.getLocalTime(zip);
  if (!localTime) return null;
  var hoursIntoDay = localTime.get('hours');
  if (hoursIntoDay < 2) return 'night';
  if (hoursIntoDay < 11) return 'morning';
  if (hoursIntoDay < 13) return 'day';
  if (hoursIntoDay < 16) return 'afternoon';
  if (hoursIntoDay < 18) return 'evening';
  return 'night';
}

module.exports.isIgnorableHistoricalOrder = isIgnorableHistoricalOrder;
module.exports.parseStoreAvailability = parseStoreAvailability;
module.exports.parseItemAvailbilityExplanation = parseItemAvailbilityExplanation;

/*
var sbuser = StarbucksUser(config.starbucks,'2er5gem7djy62pu9xp88aqpc')
exports.build(sbuser).then(function(po){
  console.log('Built',po.serialize());
}).catch(err => {
  console.error('Failed to build po',err ? (err.stack || err.data || err) : 'unknown');
});
*/
