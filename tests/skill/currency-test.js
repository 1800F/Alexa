'use strict';

var assert = require('chai').assert,
    currency = require('../../skill/currency.js');

describe('currency', function () {
  itIs('says zero amounts', 0, '0 dollars');
  itIs('says singular', 1, '1 dollar');
  itIs('says plural', 2, '2 dollars');
  itIs('says cents', 2.45, '2 dollars and 45 cents');
  itIs('says singular cents', 2.01, '2 dollars and 1 cent');
  itIs('says real case', 278.96, '278 dollars and 96 cents');
});

function itIs(testName, amount, shouldBe) {
  it(testName, function () {
    var actual = currency.say(amount, 'USD');
    assert.equal(actual, shouldBe);
  });
}