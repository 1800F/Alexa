'use strict';

var assert = require('chai').assert,
    StarbucksStateMachine = require('../../skill/StarbucksStateMachine.js'),
    config = require('../../config'),
    Request = require('../../skill/Request.js'),
    _ = require('lodash'),
    Starbucks = require('../../services/Starbucks.js'),
    starbucks = Starbucks(config.starbucks),
    access_token = null,
    StateMachineSkill = require('../../skill/StateMachineSkill.js'),
    Promise = require('bluebird');

describe('StarbucksStateMachine', function () {

  this.timeout(7000);
  this.slow(3000);
  before(function (done) {
    starbucks.login('mitchellh@rain.agency', 'Happydave12!').then(function (user) {
      access_token = user.tokens.access_token;
      done();
    }).catch(done);
  });
  describe('component', function () {
    describe('use case', function () {
      it('gets launch', function (done) {
        testRequest(fakeEvent('LaunchIntent', {})).then(function (ret) {
          assert.isOk(ret.response.outputSpeech.ssml.match(/Welcome back to starbucks/i));
          assert.isNotOk(ret.response.outputSpeech.ssml.match(/I'm sorry/i));
          done();
        }).catch(done);
      });
    });

    describe('system', function () {
      it('repeats last reprompt on bad input', function (done) {
        testRequest(fakeEvent('RepromptIntent', {
          "reprompt": "The last thing I said",
          "state": "new-payment-method-query"
        })).then(function (ret) {
          assert.equal(ret.response.outputSpeech.ssml, '<speak>The last thing I said</speak>');
          done();
        }).catch(done);
      });

      it('allows for jumping to redirects from anywhere', function (done) {
        testRequest(fakeEvent("OrderSpecificRedirectIntent", {
          state: 'greeting-accept-query',
          reprompt: 'blah'
        })).then(function (ret) {
          assert.isOk(ret.response.outputSpeech.ssml.match(/I can only help you order items that were in/i));
          done();
        }).catch(done);
      });
    });
  });
});

function testRequest(event) {
  return Starbucks(config.starbucks).login('mitchellh@rain.agency', 'Happydave12!').then(function (user) {
    event.session.user.accessToken = user.tokens.access_token;
    return new Promise(function (resolve, reject) {
      var skill = new StateMachineSkill(config.alexa.appId, StarbucksStateMachine);
      skill.execute(event, {
        succeed: resolve,
        fail: reject
      });
    });
  });
}

function fakeRequest(intent, attrs, state) {
  return new Request({ intent: { name: intent } }, {
    user: {
      accessToken: access_token
    },
    attributes: _.assign({ state: state }, attrs)
  });
}

function fakeEvent(intent, attributes) {
  return {
    "session": {
      "sessionId": "SessionId.df071b69-0719-4450-bf07-dd5dc6d1c868",
      "application": { "applicationId": "amzn1.echo-sdk-ams.app.00db3f70-5fdd-4f7a-b715-ca49e8d70252" },
      "attributes": attributes || null,
      "user": {
        "userId": "amzn1.echo-sdk-account.AFAGO3FPCYDKS365BCQMGA6IDO7U2V6X7OGUWQMIKUMCD2P22WKXE"
      },
      "new": false
    },
    "request": {
      "type": "IntentRequest",
      "requestId": "EdwRequestId.571be09b-3d5f-4bd7-8b03-bb872726e734",
      "timestamp": "2016-03-03T16:25:19Z",
      "intent": {
        "name": intent,
        "slots": {}
      }
    }
  };
}
