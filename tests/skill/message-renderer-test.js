'use strict';

var assert = require('chai').assert,
    messageRenderer = require('../../skill/message-renderer.js'),
    Promise = require('bluebird');

var data = {
  drink: 'water'
};

var responses = {
  "Generic": {
    "Say": { say: "I want {a} {drink}" },
    "Tell": { tell: "I want {a} {drink}" },
    "Ask": { ask: "I want {a} {drink}" },
    "Reprompt": { ask: "I want {a} {drink}", reprompt: "{drink}" },
    "NoNeeds": { say: "Do you like trees?" }
  },
  "Card": {
    "Simple": {
      card: {
        type: 'Simple',
        title: 'Blah',
        content: "I want {a} {drink}"
      }
    }
  }
};

var variables = {
  a: function a(data) {
    return Promise.resolve('a');
  },
  drink: function drink(data) {
    return Promise.resolve(data.drink);
  }
};

describe('message renderer', function () {
  var sut = messageRenderer(responses, variables);
  itIs('Replaces say variables', 'Generic.Say', { say: 'I want a water' });
  itIs('Replaces tell variables', 'Generic.Tell', { tell: 'I want a water' });
  itIs('Replaces ask variables', 'Generic.Ask', { ask: 'I want a water' });
  itIs('Replaces reprompt variables', 'Generic.Reprompt', { ask: 'I want a water', reprompt: "water" });
  itIs('Can work with messages without needs ', 'Generic.NoNeeds', { say: 'Do you like trees?' });
  itIs('Processes cards', 'Card.Simple', { card: { type: 'Simple', title: 'Blah', content: 'I want a water' } });

  function itIs(testName, msg, shouldBe) {
    it(testName, function (done) {
      sut(msg, data).then(function (actual) {
        assert.deepEqual(actual, shouldBe);
      }).then(function () {
        return done();
      }).catch(done);
    });
  }
});
