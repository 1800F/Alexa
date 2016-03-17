'use strict';

var assert = require('chai').assert,
    PartialOrder = require('../../services/PartialOrder.js'),
    Flowers = require('../../services/Flowers.js'),
    ProductTypes = Flowers.PRODUCTTYPES,
    _ = require('lodash');

describe('PartialOrder', function () {

  describe('Order Adjust', function () {
    var sut = null;
    beforeEach(function () {
      sut = PartialOrder.fromData(fakeApi(), { items: [{ quantity: 1, name: '1', commerce: { sku: '1' } }, { quantity: 2, name: '2', commerce: { sku: '2' } }, { quantity: 3, name: '3', commerce: { sku: '3' } }]
      });
    });

    it('starts with the first item', function () {
      sut.startOrderAdjust();
      assert.equal(sut.getOrderAdjustItem().name, '1');
      assert.isTrue(sut.hasMoreOrderAdjustItem());
    });

    it('moves to next item', function () {
      sut.startOrderAdjust();
      sut.nextOrderAdjustItem();
      assert.equal(sut.getOrderAdjustItem().name, '2');
      assert.isTrue(sut.hasMoreOrderAdjustItem());
    });

    it('removing moves to the next item', function () {
      sut.startOrderAdjust();
      sut.removeAndNextOrderAdjustItem();
      assert.equal(sut.getOrderAdjustItem().name, '2');
      assert.isTrue(sut.hasMoreOrderAdjustItem());
    });

    it('detects when out of order adjust items', function () {
      sut.startOrderAdjust();
      sut.nextOrderAdjustItem();
      sut.nextOrderAdjustItem();
      assert.equal(sut.getOrderAdjustItem().name, '3');
      assert.isTrue(sut.hasMoreOrderAdjustItem());
      sut.nextOrderAdjustItem();
      assert.isFalse(sut.hasMoreOrderAdjustItem());
    });

    it('it knows what removed items are', function () {
      sut.startOrderAdjust();
      sut.removeAndNextOrderAdjustItem();
      sut.removeAndNextOrderAdjustItem();
      assert.equal(sut.getOrderAdjustItem().name, '3');
      assert.equal(sut.getOrderAdjustRemovedItems().length, 2);
      assert.equal(sut.getOrderAdjustRemovedItems().map(function (x) {
        return x.name;
      }).join(','), '1,2');
    });

    it('it can remove the last item', function () {
      sut.startOrderAdjust();
      sut.nextOrderAdjustItem();
      sut.removeAndNextOrderAdjustItem();
      sut.removeAndNextOrderAdjustItem();
      assert.equal(sut.getOrderAdjustRemovedItems().length, 2);
      assert.equal(sut.getOrderAdjustRemovedItems().map(function (x) {
        return x.name;
      }).join(','), '2,3');
      assert.isFalse(sut.hasMoreOrderAdjustItem());
    });

    it('it restores order adjustments', function () {
      sut.startOrderAdjust();
      sut.removeAndNextOrderAdjustItem();
      sut.removeAndNextOrderAdjustItem();
      sut.revertOrderAdjust();
      assert.equal(sut.getOrderAdjustItem().name, '1');
      assert.equal(sut.getOrderAdjustRemovedItems().map(function (x) {
        return x.name;
      }).join(','), '');
    });

    it('it forces last item when removed all before', function () {
      sut.startOrderAdjust();
      assert.isFalse(sut.currentOrderAdjustItemIsForced());
      sut.removeAndNextOrderAdjustItem();
      assert.isFalse(sut.currentOrderAdjustItemIsForced());
      sut.removeAndNextOrderAdjustItem();
      assert.isTrue(sut.currentOrderAdjustItemIsForced());
    });

    it('it does not force item if passed a previous one', function () {
      sut.startOrderAdjust();
      assert.isFalse(sut.currentOrderAdjustItemIsForced());
      sut.nextOrderAdjustItem();
      assert.isFalse(sut.currentOrderAdjustItemIsForced());
      sut.removeAndNextOrderAdjustItem();
      assert.isFalse(sut.currentOrderAdjustItemIsForced());
    });
  });

  describe('isIgnorableHistoricalOrder', function () {
    var sut = PartialOrder.isIgnorableHistoricalOrder;

    itIs('ignores a packaged coffee order', [byType('coffee')], true);
    itIs('ignores an order with two packaged coffee', [byType('coffee'), byType('coffee')], true);
    itIs('does not ignores an order with a beverage', [byType('beverage')], false);
    itIs('does not ignores an order with food', [byType('food')], false);
    itIs('does not ignores an order with food and coffee', [byType('food'), byType('coffee')], false);

    function byType(type) {
      return { product: { productType: ProductTypes[type] } };
    }

    function itIs(testName, items, expected) {
      it(testName, function () {
        return assert.equal(sut(makeHistorialOrder(items)), expected);
      });
    }
  });

  describe('parseStoreAvailability', function () {
    var genericStore = {
      "id": "14677",
      "name": "Kahala Mall Interior - Waialae Ave",
      "brandName": "Starbucks",
      "storeNumber": "21001-8605",
      "operatingStatus": {
        "operating": true,
        "openDate": "1/24/2006 12:00:00 AM",
        "closeDate": null,
        "status": "ACTIVE"
      },
      "today": {
        "open": true,
        "open24Hours": false,
        "openTime": "04:00:00",
        "closeTime": "00:00:00",
        "localTime": "2016-02-22T10:57:09.3811570",
        "openAsOfLocalTime": true,
        "opensIn": null,
        "closesIn": "13:02:50"
      },
      "xopState": 'available'
    };
    var sut = PartialOrder.parseStoreAvailability;
    it('detects open and active stores', function () {
      var actual = sut(_.merge({}, genericStore));
      var expected = { isOpen: true, localTime: "2016-02-22T10:57:09.3811570", nextOpen: null, closedDueTo: null };
      assert.deepEqual(actual, expected);
    });

    it('detects stores close until tomorrow', function () {
      var actual = sut(_.merge({}, genericStore, {
        today: {
          open: false,
          localTime: "2016-02-22T16:28:08.1821332"
        },
        hoursNext7Days: [{ open: true, date: '2016-02-23T00:00:00.000', openTime: "06:00:00" }]
      }));
      var expected = {
        isOpen: false,
        localTime: "2016-02-22T16:28:08.1821332",
        nextOpen: '2016-02-23T06:00:00.000',
        closedDueTo: 'hours'
      };
      assert.deepEqual(actual, expected);
    });

    it('detects stores close for two days', function () {
      var actual = sut(_.merge({}, genericStore, {
        today: {
          open: false,
          localTime: "2016-02-22T16:28:08.1821332"
        },
        hoursNext7Days: [{ open: false }, { open: true, date: '2016-02-24T00:00:00.000', openTime: "06:00:00" }]
      }));
      var expected = {
        isOpen: false,
        localTime: "2016-02-22T16:28:08.1821332",
        nextOpen: '2016-02-24T06:00:00.000',
        closedDueTo: 'hours'
      };
      assert.deepEqual(actual, expected);
    });

    it('detects stores closed for forseable future', function () {
      var actual = sut(_.merge({}, genericStore, {
        today: {
          open: false,
          localTime: "2016-02-22T16:28:08.1821332"
        },
        hoursNext7Days: [{ open: false }, { open: false }, { open: false }, { open: false }, { open: false }, { open: false }, { open: false }]
      }));
      var expected = {
        isOpen: false,
        localTime: "2016-02-22T16:28:08.1821332",
        nextOpen: null,
        closedDueTo: 'inactive'
      };
      assert.deepEqual(actual, expected);
    });

    it('stores without xopState as being closed', function () {
      var actual = sut(_.merge({}, genericStore, {
        xopState: 'unavailable'
      }));
      var expected = {
        isOpen: false,
        localTime: null,
        nextOpen: null,
        closedDueTo: 'inactive'
      };
      assert.deepEqual(actual, expected);
    });
  });

  describe('parseItemAvailbilityExplanation', function () {
    var sut = PartialOrder.parseItemAvailbilityExplanation;
    itIs('seasonal', '108517', 'seasonal');
    itIs('discontinued', '11040655', 'permanent');
    itIs('purchasable', '12000028472', 'temporary');

    function itIs(dataFile, sku, result) {
      it(dataFile + ' => ' + result, function () {
        var actual = sut(sku, require('../data/product-details/' + dataFile + '.js'));
        assert.equal(actual, result);
      });
    }
  });
});

function fakeApi() {
  var analytics = {
    event: function event() {
      return analytics;
    },
    send: function send() {
      return analytics;
    }
  };
  return {
    analytics: analytics
  };
}

function makeHistorialOrder(basketItems) {
  return {
    id: '1',
    basket: {
      items: basketItems
    }
  };
}