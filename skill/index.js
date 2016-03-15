'use strict';

var StateMachineSkill = require('./StateMachineSkill.js'),
    StarbucksStateMachine = require('./StarbucksStateMachine.js'),
    config = require('../config');

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
  var skill = new StateMachineSkill(config.alexa.appId, StarbucksStateMachine);
  skill.execute(event, context);
};