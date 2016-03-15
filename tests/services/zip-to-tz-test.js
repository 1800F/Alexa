'use strict';

var assert = require('chai').assert,
    zipToTZ = require('../../services/zip-to-tz.js'),
    moment = require('moment'),
    dstDate = '2016-01-01T12:00:00Z',
    stDate = '2016-06-01T12:00:00Z';

describe('zipToTz', function () {
  itIs('Converts times to local', '00210', stDate, moment('2016-06-01T07:00:00-05:00'));
  itIs('Converts times to local in daylight time', '00210', dstDate, moment('2016-01-01T06:00:00-06:00'));
  itIs('Converts times to local in non-dst tz in standard time', '00601', stDate, moment('2016-06-01T08:00:00-04:00'));
  itIs('Converts times to local in non-dst tz in daylight time', '00601', dstDate, moment('2016-01-01T08:00:00-04:00'));
  itIs('Pads zipcodes', '210', stDate, moment('2016-06-01T07:00:00-05:00'));
  itIs('Gives null for unknown codes', '00300', stDate, null);
  itIs('Works for extreme Alaska tzs', '99692', stDate, moment('2016-06-01T02:00:00-10:00'));
  itIs('Works for a troublesome instance', '98155', stDate, moment('2016-06-01T04:00:00-08:00'));
});

function itIs(testName, zip, date, shouldBe) {
  it(testName, function () {
    var actual = zipToTZ.getLocalTime(zip, date);
    if (shouldBe === null) assert.isNull(actual);
    //else assert.equal(shouldBe.valueOf(),actual.valueOf(),`Expected ${actual.format()} to equal ${shouldBe.format()}`);
    else assert.isTrue(shouldBe.isSame(actual), 'Expected ' + actual.format() + ' to equal ' + shouldBe.format());
  });
}