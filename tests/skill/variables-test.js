'use strict';

var assert = require('chai').assert,
    variables = require('../../skill/variables.js'),
    moment = require('moment'),
    Promise = require('bluebird');

describe('variables', function () {
  describe('orderLocationOpenHour', function () {
    var sut = variables.orderLocationOpenHour;
    var now = moment('2016-01-01T06:00:00');
    itIs(0, '6:30 am');
    itIs(1, '6:30 am tomorrow');
    itIs(2, '6:30 am on Sunday');

    function itIs(days, expected) {
      it(days + ' => "' + expected + '"', function () {
        var actual = sut({ noStoreAvailableExplanation: { myStore: { localTime: now, nextOpen: moment(now).add(days, 'days').add(30, 'minutes').format('YYYY-MM-DDTHH:mm:ss') } } });
        assert.equal(actual, expected);
      });
    }
  });

  describe('orderPriceTextFormatted', function () {
    var sut = variables.orderPriceTextFormatted;
    itIs(0.34, '$0.34');
    itIs(0.3, '$0.30');
    itIs(1.34, '$1.34');
    itIs(1.3, '$1.30');

    function itIs(amount, expected) {
      it(amount + ' => "' + expected + '"', function () {
        var actual = sut({ pricing: { totalAmount: amount } });
        assert.equal(actual, expected);
      });
    }
  });

  describe('orderItemsListTextFormatted', function () {
    var sut = variables.orderItemsListTextFormatted;
    var po = { items: [{ quantity: 1, name: 'Tall Salted Carmel Mocha' }, { quantity: 2, name: 'Pumpkin Spice' }] };
    it('Formats an item list', function () {
      var actual = sut(po);
      assert.equal(actual, '- (1) Tall Salted Carmel Mocha\n- (2) Pumpkin Spice');
    });
  });

  describe('orderLocationFullAddress', function () {
    var sut = variables.orderLocationFullAddress;
    it('Formats addresses', function (done) {
      var po = {};
      po.getStoreData = function () {
        return Promise.resolve({ address: {
            "streetAddressLine1": "2711 NW Town Center Dr. #1",
            "streetAddressLine2": null,
            "streetAddressLine3": null,
            "city": "Beaverton",
            "countrySubdivisionCode": "OR",
            "countryCode": "US",
            "postalCode": "970068951"
          } });
      };
      sut(po).then(function (actual) {
        assert.equal(actual, '2711 NW Town Center Dr. #1\nBeaverton, OR 970068951');
        done();
      }).catch(done);
    });

    function itIs(days, expected) {
      it(days + ' => "' + expected + '"', function () {
        var actual = sut({ noStoreAvailableExplanation: { myStore: { localTime: now, nextOpen: moment(now).add(days, 'days').add(30, 'minutes').format('YYYY-MM-DDTHH:mm:ss') } } });
        assert.equal(actual, expected);
      });
    }
  });
});
