'use strict';

var _ = require('lodash'),
    Promise = require('bluebird'),
    lang = require('./lang.js'),
    currency = require('./currency.js'),
    moment = require('moment'),
    phonetic = require('./phonetic.js')
    ;

exports.userName = function (po) {
  if(!po) return '';
  return po.getProfile().then(function (profile) {
    return profile.name;
  })
};

exports.greetingDayReference = function (po) {
  return po.getProfile().then(function (profile) {
    if (profile.timeOfDay == 'day' || profile.timeOfDay == 'night') return 'Hello';
    if (profile.timeOfDay) return 'Good ' + profile.timeOfDay;
    return 'Hello';
  });
};

exports.goodbyeDayReference = function (po) {
  if(!po) return 'great day';
  return po.getProfile().then(function (profile) {
    if (profile.timeOfDay) return 'great ' + profile.timeOfDay;
    return 'great day';
  });
};

exports.orderItem = function (po) {
  return po.getProductNames().then(function () {
    var item = po.items[0];
    return phonetic.replace(lang.quantify(item.quantity, item.name));
  });
};

exports.orderItemToRemove = function (po) {
  var item = po.getOrderAdjustItem();
  if (item.quantity > 1) return phonetic.replace(lang.quantify(item.quantity, item.name));
  return phonetic.replace(item.name);
};

exports.orderLocation = function (po) {
  return po.getStoreData(po.store).then(function (storeData) {
    return storeData.name;
  });
};

exports.orderLocationFullAddress = function (po) {
  return po.getStoreData(po.store).then(function (storeData) {
    var addr = storeData.address || {};
    return _.compact([addr.streetAddressLine1, addr.streetAddressLine2, addr.city + ', ' + addr.countrySubdivisionCode + ' ' + addr.postalCode]).join('\n');
  });
};

exports.totalLocAdjustLocations = function (po) {
  return po.locAdjust.stores.length;
};

exports.locAdjustOrderLocation = function (po) {
  return po.getStoreData(po.getLocAdjustLoc()).then(function (storeData) {
    return storeData.name;
  });
};

exports.currentBalance = function (po) {
  return po.getBalance().then(function (balance) {
    return currency.say(balance.balance, balance.currencyCode);
  });
};

exports.currentBalanceTextFormatted = function (po) {
  return '$' + po.balance.balance.toFixed(2);
};
exports.reloadAmount = function (po) {
  return currency.say(po.pricing.reloadAmount, po.balance.currencyCode);
};

exports.reloadAmountTextFormatted = function (po) {
  return '$' + po.pricing.reloadAmount.toFixed(2);
};

exports.orderItemsListTextFormatted = function (po) {
  return _.map(po.items, display).join('\n');
  function display(item) {
    return '- (' + item.quantity + ') ' + item.name;
  }
};

exports.anOrderItemList = function (po) {
  return po.getProductNames().then(function () {
    return phonetic.replace(lang.enumerate(_.map(po.items, function (item) {
      return lang.quantify(item.quantity, item.name);
    })));
  });
};

exports.orderItemList = function (po) {
  return po.getProductNames().then(function () {
    return phonetic.replace(lang.enumerate(_.map(po.items, function (item) {
      return lang.quantify(item.quantity, item.name, { articles: false });
    })));
  });
};

exports.fallbackItems = function (po) {
  return phonetic.replace(lang.enumerate(_.map(po.fallback.originalOrder.items, function (item) {
    return lang.quantify(item.quantity, item.name, { articles: false });
  })));
};

exports.fallbackItemsIsAre = function (po) {
  return po.fallback.originalOrder.items.length <= 1 ? 'is' : 'are';
};

exports.orderItemNotAvailable = function (po) {
  return phonetic.replace(lang.enumerate(_.map(po.pruned, function (item) {
    if (item.quantity > 1) return lang.quantify(item.quantity, item.name);
    return item.name;
  })));
};

exports.prunedItemsIsOrAre = function (po) {
  return po.pruned.length > 1 ? 'are' : 'is';
};

exports.prunedItemsThatItemOrThoseItems = function (po) {
  return po.pruned.length > 1 ? 'those items' : 'that item';
};

exports.orderPrice = function (po) {
  return currency.say(po.pricing.totalAmount, po.pricing.currencyCode);
};

exports.orderPriceTextFormatted = function (po) {
  return '$' + po.pricing.totalAmount.toFixed(2);
};

exports.totalItems = function (po) {
  return po.items.length;
};

exports.pickupTime = function (po) {
  return po.pickup.minimumWait + ' to ' + po.pickup.maximumWait;
};

exports.orderLocationOpenHour = function (po) {
  var myStore = po.noStoreAvailableExplanation.myStore,
      localTime = moment(myStore.localTime),
      nextOpen = moment(myStore.nextOpen),
      gap = moment.duration(moment(nextOpen).startOf('day').diff(moment(localTime).startOf('day'))),
      timeOfDay = nextOpen.format('h:mm a');
  if (gap.asDays() < 1) return timeOfDay;
  if (gap.asDays() < 2) return timeOfDay + ' tomorrow';
  return timeOfDay + ' on ' + nextOpen.format('dddd');
};
