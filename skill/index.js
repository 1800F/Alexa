'use strict';

var StateMachineSkill = require('./StateMachineSkill.js'),
    FlowersStateMachine = require('./FlowersStateMachine.js'),
    Raven = require('raven'),
    ravenAWSLambda = require('raven-aws-lambda'),
    config = require('../config');

Raven.config(config.sentry.DSN);

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
  Raven.context(function () {
    var skill = new StateMachineSkill(config.alexa.appId, FlowersStateMachine);
    skill.execute(event, ravenAWSLambda.init(event, context, config.sentry));
  });
};
