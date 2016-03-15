'use strict';

var assert = require('chai').assert,
  phonetic = require('../../skill/phonetic.js');

describe('phonetic', function () {
  itIs('i want some misto please', 'i want some <phoneme alphabet="ipa" ph="mis̺t̪o">misto</phoneme> please');
  itIs('i want some venti please', 'i want some <phoneme alphabet="ipa" ph="vɛnti">venti</phoneme> please');
});

function itIs(from, to) {
  it(from + ' => ' + to, function () {
    var actual = phonetic.replace(from);
    assert.equal(actual, to);
  });
}
