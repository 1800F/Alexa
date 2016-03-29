'use strict';

var StateMachine = require('./StateMachine.js'),
    currency = require('./currency.js'),
    Reply = require('./reply.js'),
    alexaFlowers = require('../services/alexa-flowers.js'),
    Flowers = require('../services/Flowers.js'),
    FlowersUser = Flowers.FlowersUser,
    config = require('../config'),
    StateMachineSkill = require('./StateMachineSkill.js'),
    _ = require('lodash'),
    PartialOrder = require('../services/PartialOrder.js'),
    responses = require('./responses.js'),
    messageRenderer = require('./message-renderer.js')(responses, require('./variables.js')),
    verbose = config.verbose,
    Promise = require('bluebird'),
    universalAnalytics = require('universal-analytics'),
    OAuthHelpers = require('../services/oauth-helpers.js'),
    oauthhelper = OAuthHelpers(config.alexa.auth);

var flowers = null;

module.exports = StateMachine({
  onTransition: function onTransition(trans, request) {
    if (trans.reply) {
      var reprompt = trans.reply.msg.reprompt;
      if (reprompt) {
        request.session.attributes.reprompt = reprompt;
        return;
      }
    }
    request.session.attributes.reprompt = null;
  },
  onBadResponse: function onBadResponse(request) {
    var reprompt = request.session.attributes.reprompt;
    if (reprompt) {
      return { ask: reprompt };
    }

    return _.at(responses, 'Errors.ErrorNonPlannedAtLaunch')[0];

  },
  onAuthError: function onAuthError() {
    return new Reply(_.at(responses, 'Errors.NotConnectedToAccount')[0]);
  },
  onError: function onError(request, error) {
    var _this = this;

    var self = this;
    return this.Access(request).then(function (user) {
      return PartialOrder.fromRequest(user, request);
    }).then(function (po) {
      if(error) po.analytics.exception(error.stack || error.body || error.data || error.message || error).send();
      if (_this.isInState('launch', 'entry')) return replyWith('Errors.ErrorAtLaunch', 'die', request, po);
      if (_this.isInState('confirm', 'confirm-query', 'place', 'reload-query')) return replyWith('Errors.ErrorAtOrder', 'die', request, po);
      return new Reply(_.at(responses, 'Errors.ErrorGeneral')[0]);
    }).catch(function (err) {
      console.error('Error rendering error', err.stack);
      var analytics = universalAnalytics(config.googleAnalytics.trackingCode, request.session.user.userId, { strictCidFormat: false });
      analytics.exception(err.stack || err.body || err.data || err.message || err, true).send();
      return new Reply(_.at(responses, 'Errors.ErrorGeneral')[0]);
    });
  },
  onSessionStart: function onSessionStart(request) {
    var analytics = universalAnalytics(config.googleAnalytics.trackingCode, request.user.userId, { strictCidFormat: false });
    analytics.event('Main Flow', 'Session Start').send();
    request.session.attributes.startTimestamp = +new Date();
  },
  onSessionEnd: function onSessionEnd(request) {
    var analytics = universalAnalytics(config.googleAnalytics.trackingCode, request.user.userId, { strictCidFormat: false }),
        start = request.session.attributes.startTimestamp,
        elapsed = +new Date() - start;
    analytics.event('Main Flow', 'Session End').send();
    if (start) {
      if (verbose) console.log('Session Duration', elapsed);
      analytics.timing('Main Flow', 'Session Duration', elapsed).send();
    }
  },
  openIntent: 'LaunchIntent',
  states: {
    "entry": {
      to: {
        LaunchIntent: 'launch',
        ExitIntent: 'exit',
        RecipientSelectionIntent: 'recipient-selection',
        ArrangementSelectionIntent: 'arrangement-selection',
        SizeSelectionIntent: 'size-selection',
        DateSelectionIntent: 'date-selection',
        OrderReviewIntent: 'order-review'
      }
    },
    'exit': {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          return replyWith('Exit.GeneralExit', 'die', request, po);
        })
        .catch(function(){
          return replyWith('Exit.GeneralExit', 'die', request, null);
        });
      }
    },
    'die': { isTerminal: true },
    "launch": {
      enter: function enter(request) {
        return this.Access(request)
          .then(PartialOrder.build)
          .then(function (po) {
            // if (po.noRecipientsInAddressBook) {
            // return replyWith('Errors.NoRecipientsInAddressBook', 'die', request, po);
            // }

            // We go to choose the arrange type
            return replyWith('Options.NoRecipient', 'recipient-selection', request);
          });
      }
    },
    "recipient-selection": {
      enter: function enter(request) {
        // request.intent.params.Name
        return replyWith('Options.ArrangementList', 'arrangement-selection', request);
      }
    },
    "arrangement-selection": {
      enter: function enter(request) {
        // request.intent.params.ArrangementType
        return replyWith('Options.SizeList', 'size-selection', request);
      }
    },
    "size-selection": {
      enter: function enter(request) {
        // request.intent.params.ArrangementSize
        return replyWith('Options.DateSelection', 'size-selection', request);
      }
    },
    "date-selection": {
      enter: function enter(request) {
        return replyWith('Options.OrderReview', 'order-review', request);
      }
    },
    "order-review": {
      enter: function enter(request) {
        return replyWith('ExitIntent.RepeatLastAskReprompt', 'die', request);
      }
    }
  },
  Access: function Access(request) {
    var self = this;
    if (this.access) return Promise.resolve(this.access);
    if (!request || !request.user || !request.user.accessToken) {
      //Allow logging in with fake credentials for debugging
      if (!config.skill.fakeCredentials) {
        var analytics = universalAnalytics(config.googleAnalytics.trackingCode, request.session.user.userId, { strictCidFormat: false });
        analytics.event('Main Flow', 'Exit from not authorized').send();
        return Promise.reject(StateMachineSkill.ERRORS.AUTHORIZATION);
      }
      return Promise.try(function () {
        flowers = flowers || Flowers(config.flowers);
        console.log('Using faked credentials. This should never happen in live!');
        return flowers.login(config.skill.fakeCredentials.username, config.skill.fakeCredentials.password).then(function (user) {
          self.access = {
            user: user,
            flowers: flowers,
            analytics: universalAnalytics(config.googleAnalytics.trackingCode, request.session.user.userId, { strictCidFormat: false })
          };
          return self.access;
        });
      });
    }
    //HERE IS WHERE WE WILL GET AN OAUTH ACCESSTOKEN USING THE DEFAULT CREDENTIALS
    //THEN WE WILL PULL USER DATA BASED ON SYSTEMID STORED IN THE ALEXA REQUEST IN PartialOrder.build()
    //FIRST CALL flowers.getProfile, THEN flowers.getRecipients, THEN flowers.getPaymentMethods
    return Promise.try(function () {
      flowers = flowers || Flowers(config.flowers);
      console.log('Logging in using default credentials.');
      return flowers.login(config.skill.defaultCredentials.username, config.skill.defaultCredentials.password).then(function (user) {
        //Store the systemID and customerID that should be in the request.user.accessToken to the user object
        var tokens = oauthhelper.decryptCode(request.user.accessToken);
        user.systemID = tokens.systemID;
        user.customerID = tokens.customerID;
        self.access = {
          user: user,
          flowers: flowers,
          analytics: universalAnalytics(config.googleAnalytics.trackingCode, request.session.user.userId, { strictCidFormat: false })
        };
        return self.access;
      });
    });
  }
});

function isHelpState(state) {
  if (!state) return false;
  return module.exports.getState(state).name.toLowerCase().indexOf('help') >= 0;
}

function replyWith(msgPath, state, request, partialOrder) {
  if (verbose) console.log('Move to state [' + state + '] and say ' + msgPath);
  return renderMessage(msgPath, partialOrder).then(function (msg) {
    return {
      message: msg,
      to: state,
      session: {
        partialOrder: partialOrder ? partialOrder.serialize() : request.session.attributes.partialOrder,
        startTimestamp: request.session.attributes.startTimestamp
      }
    };
  });
}

function renderMessage(msgPath, partialOrder) {
  if (!msgPath) return Promise.resolve(null);
  return messageRenderer(msgPath, partialOrder);
}

function SimpleHelpMessage(msgPath, analyticEvent, toState) {
  return {
    enter: function enter(request) {
      var analytics = universalAnalytics(config.googleAnalytics.trackingCode, request.session.user.userId, { strictCidFormat: false });
      analytics.event('Help Flow', analyticEvent).send();
      return replyWith(msgPath, toState || 'more-help-query', request, null);
    }
  };
}
