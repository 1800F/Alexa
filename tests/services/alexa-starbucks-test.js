'use strict';

var assert = require('chai').assert,
    alexaStarbucks = require('../../services/alexa-starbucks.js');

describe('alexa-starbucks', function () {
  describe('getReloadAmount', function () {
    itIs(1, 2, 10);
    itIs(1, 8, 10);
    itIs(1, 1, 0);
    itIs(3, 2, 0);
    itIs(0, 12, 15);
    itIs(30, 200, 170);
    itIs(0, 200, 200);
    itIs(0, 200.01, 205);

    function itIs(currentBalance, charge, expected) {
      it('Charging ' + charge + ' when you\'ve got ' + currentBalance + ' recharges for ' + expected, function () {
        var actual = alexaStarbucks.getReloadAmount(currentBalance, charge);
        assert.equal(actual, expected);
      });
    }
  });
});