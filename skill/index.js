'use strict';

var StateMachineSkill = require('./StateMachineSkill.js'),
    FlowersStateMachine = require('./FlowersStateMachine.js'),
    config = require('../config');

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
  var skill = new StateMachineSkill(config.alexa.appId, FlowersStateMachine);
  skill.execute(event, context);
};