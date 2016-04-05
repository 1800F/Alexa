'use strict';

var StateMachine = require('./StateMachine.js'),
    currency = require('./currency.js'),
    Reply = require('./reply.js'),
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
    // Remember the last re-prompt. We're going to play it back in the case of a bad response
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
    var reply = new Reply();
    var reprompt = request.session.attributes.reprompt;
    // The user said something unexpected, replay the last reprompt
    if (reprompt) {
      reply.append(_.at(responses, 'BadInput.RepeatLastAskReprompt')[0]);
      reply.append({ ask: reprompt });
    } else {
      reply.append(_.at(responses, 'Errors.ErrorNonPlannedAtLaunch')[0]);
    }

    return reply;
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
      if (_this.isInState('confirm', 'confirm-query', 'place')) return replyWith('Errors.ErrorAtOrder', 'die', request, po);
      return new Reply(_.at(responses, 'Errors.ErrorGeneral')[0]);
    }).catch(function (err) {
      if(verbose) console.error('Error rendering error', err.stack);
      analytics(request).exception(err.stack || err.body || err.data || err.message || err, true).send();
      return new Reply(_.at(responses, 'Errors.ErrorGeneral')[0]);
    });
  },
  onSessionStart: function onSessionStart(request) {
    request.session.attributes.startTimestamp = +new Date();
    console.log('Session start');
    analytics(request).event('Main Flow', 'Session Start', {sc: 'start'}).send();
  },
  onSessionEnd: function onSessionEnd(request) {
      var start = request.session.attributes.startTimestamp,
        elapsed = +new Date() - start
    ;
    analytics(request).event('Main Flow', 'Session End', {sc: 'end'}).send();
    if (start) {
      if (verbose) console.log('Session Duration', elapsed); // We used to log this to GA timing API, but they didn't want that anymore, now it's just an FYI
    }
  },
  openIntent: 'LaunchIntent',
  states: {
    "entry": {
      to: {
        LaunchIntent: 'launch',
        RecipientSelectionIntent: 'recipient-selection',
        ArrangementSelectionIntent: 'arrangement-selection',
        SizeSelectionIntent: 'size-selection',
        DateSelectionIntent: 'date-selection',
        OrderReviewIntent: 'order-review',
        "AMAZON.HelpIntent": 'help-menu',
        "AMAZON.StopIntent": 'exit'
      }
    },
    'exit': {
      enter: function enter(request) {
        return this.Access(request)
          .then(function(api){ return PartialOrder.fromRequest(api,request); })
          .then(function(po){
            return replyWith('ExitIntent.RepeatLastAskReprompt', 'die', request, po);
          })
          .catch(function(){
            return replyWith('ExitIntent.RepeatLastAskReprompt', 'die', request, null);
          });
      }
    },
    'die': { isTerminal: true },
    "launch": {
      enter: function enter(request) {
        return this.Access(request)
        .then(PartialOrder.empty)
        .then(function (po) {
          po.possibleRecipient = request.intent.params.recipientSlot;
          po.possibleDeliveryDate = request.intent.params.deliveryDateSlot;
          po.pickArrangement(request.intent.params.arrangementSlot);
          po.pickSize(request.intent.params.sizeSlot);
          return po.getContactBook().then(function(contactBook){
            if(!po.contactBook.hasContacts()) return replyWith('Errors.NoRecipientsInAddressBook', 'die', request, po);
            return replyWith(null, 'options-review', request, po);
          });
        });
      }
    },
    "options-review": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if(!po.hasRecipient()) {
            if(po.possibleRecipient) return replyWith(null,'validate-possible-recipient',request,po);
            return replyWith('Options.RecipientSelection','query-recipient',request,po);
          }
          if(!po.hasArrangement()) return replyWith('Options.ArrangementList', 'query-arrangement-type', request, po);
          if(!po.hasSize()) return replyWith('Options.SizeList', 'query-size', request, po);
          if(!po.hasDeliveryDate()) {
            if(po.possibleDeliveryDate) return replyWith(null,'validate-possible-delivery-date',request,po);
            return replyWith('Options.DateSelection','query-date',request,po);
          }
          return replyWith(null,'order-review',request,po);
        });
      }
    },
    "query-recipient": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){ return po.getContactBook().then(_.constant(po)); })
        .then(function(po){
          if (request.intent.name == 'AMAZON.YesIntent' || request.intent.name == 'AMAZON.NoIntent' || request.intent.name == 'DescriptionIntent') {
            po.setupRecipientChoices();
            if(!po.getRecipientChoices().length) return replyWith('QueryRecipientList.ContinueWithOrder','query-options-again',request,po);
            if(po.isLastRecipientChoiceOffer()) return replyWith('QueryRecipient.RecipientList','query-recipient-list',request,po);
            return replyWith('QueryRecipient.FirstFourRecipientList','query-recipient-list',request,po);
          }
        });
      }
    },
    "query-recipient-list": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if (request.intent.name == 'AMAZON.YesIntent') {
            return replyWith('QueryRecipientList.OkayWho','query-recipient-list',request,po);
          }else if (request.intent.name == 'AMAZON.NoIntent') {
            po.nextRecipientChoices();
            if(!po.getRecipientChoices().length) return replyWith('QueryRecipientList.ContinueWithOrder','query-options-again',request,po);
            if(po.isLastRecipientChoiceOffer()) return replyWith('QueryRecipient.LastRecipientList','query-recipient-list',request,po);
            return replyWith('QueryRecipientList.NextFourRecipientList','query-recipient-list',request,po);
          }
        });
      }
    },
    "recipient-selection": {
      enter: function enter(request) {
        // request.intent.params.recipientSlot
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){ return po.getContactBook().then(_.constant(po)); })
        .then(function(po){
          po.possibleRecipient = request.intent.params.recipientSlot;
          return replyWith(null,'validate-possible-recipient',request,po);
        });
      }
    },
    "validate-possible-recipient": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          po.setupContactCandidates();
          if(!po.hasContactCandidate()) {
            return replyWith('ValidatePossibleRecipient.NotInAddressBook', 'clear-and-query-options-again', request, po);
          }
          return replyWith('ValidatePossibleRecipient.FirstAddress', 'query-address', request, po);
        });
      }
    },
    "query-address": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if (request.intent.name == 'AMAZON.YesIntent') {
            //TODO: Determine if this address is deliverable. If not, QueryAddress.AddressNotDeliverable, and go to next address
            if (!(po.isContactCandidateDeliverable())) {
              return replyWith('QueryAddress.AddressNotDeliverable', 'query-address-continue', request, po);
            }
            po.acceptCandidateContact();
            return replyWith('QueryAddress.RecipientValidation','options-review',request,po);
          }else if (request.intent.name == 'AMAZON.NoIntent') {
            return replyWith(null, 'query-address-continue', request, po);
          }

        });
      }
    },
    "query-address-continue": {
      enter: function enter(request) {
        return this.Access(request)
          .then(function(api){ return PartialOrder.fromRequest(api,request); })
          .then(function(po) {
            po.nextContactCandidate();
            if(!po.hasContactCandidate()) return replyWith('QueryAddress.SendToSomeoneElse', 'clear-and-query-options-again', request, po);
            return replyWith('QueryAddress.NextAddress', 'query-address', request, po);
          });
      }
    },
    "query-arrangement-type": {
      to: {
        DescriptionIntent: 'arrangement-descriptions',
        LaunchIntent: 'arrangement-selection'
      }
    },
    "arrangement-descriptions": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if (request.intent.name == 'DescriptionIntent') {
            po.setupArrangementDescriptions();
            if (verbose) console.log('Current Arrangement ' + po.getArrangementDescription().name);
            return replyWith('QueryArrangementType.FirstArrangmentDescription', 'arrangement-descriptions', request, po);
          } else if (request.intent.name == 'AMAZON.NoIntent') {
            po.nextArrangementDescription();
            if (!po.hasArrangementDescription()) {
              return replyWith('ArrangementDescriptions.MoreArrangmentsOnline', 'query-continue-with-order', request, po);
            }
            if (verbose) console.log('Current Arrangement ' + po.getArrangementDescription().name);
            return replyWith('ArrangementDescriptions.NextArrangmentDescription', 'arrangement-descriptions', request, po);
          } else if (request.intent.name == 'AMAZON.YesIntent') {
            request.intent.params.arrangementSlot = po.getArrangementDescription().name;
            po.clearArrangementDescriptions();
            return replyWith(null, 'arrangement-selection', request, po);
          }
        });
      }
    },
    "arrangement-selection": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          return po.pickArrangement(request.intent.params.arrangementSlot).then(function (success) {
            if (!success) {
              return replyWith('Errors.ErrorGeneral', 'die', request, po);
            }
            return replyWith('ArrangementSelectionIntent.ArrangementValidation', 'options-review', request, po);
          });
        });
      }
    },
    "query-continue-with-order": {
      enter: function enter (request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po) {
          return replyWith('ArrangementDescriptions.ContinueWithOrder', 'query-options-again', request, po);
        });
      }
    },
    "query-size": {
      to: {
        DescriptionIntent: 'size-descriptions',
        LaunchIntent: 'size-selection'
      }
    },
    "size-descriptions": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if (request.intent.name == 'DescriptionIntent') {
            po.setupSizeDescriptions();
            if (verbose) console.log('Current Size ' + po.getSizeDescription().name);
            return replyWith('QuerySize.FirstSizeDescription', 'size-descriptions', request, po);
          } else if (request.intent.name == 'AMAZON.NoIntent') {
            po.nextSizeDescription();
            if (!po.hasSizeDescription()) {
              return replyWith('SizeDescriptions.ContinueWithOrder', 'query-options-again', request, po);
            }
            if (verbose) console.log('Current Size ' + po.getSizeDescription().name);
            return replyWith('SizeDescriptions.NextSizeDescription', 'size-descriptions', request, po);
          } else if (request.intent.name == 'AMAZON.YesIntent') {
            request.intent.params.sizeSlot = po.getSizeDescription().name;
            po.clearSizeDescriptions();
            return replyWith(null, 'size-selection', request, po);
          }
        });
      }
    },
    "size-selection": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          po.pickSize(request.intent.params.sizeSlot);
          return replyWith('SizeSelectionIntent.SizeValidation', 'options-review', request, po);
        });
      }
    },
    "date-selection": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          po.possibleDeliveryDate = request.intent.params.deliveryDateSlot;
          return replyWith(null, 'validate-possible-delivery-date', request, po);
        });
      }
    },
    "query-date": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if (request.intent.name == 'AMAZON.YesIntent') {
            if(po.deliverDateOffers && po.deliverDateOffers.length == 1) {
              po.acceptPossibleDeliveryDate(po.deliverDateOffers[0]);
              return replyWith('QueryDate.DateValidation', 'order-review', request);
            }
            return replyWith('QueryDate.DateSelectionAgain', 'order-review', request);
          } else if (request.intent.name == 'AMAZON.NoIntent') {
            return replyWith('QueryDate.ContinueWithOrder','query-options-again',request,po);
          }
        });
      }
    },
    "validate-possible-delivery-date": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          po.deliveryDateOffers = null;
          return po.isDateDeliverable(po.possibleDeliveryDate)
          .then(function(isDeliverable){
            if(isDeliverable) {
              po.acceptPossibleDeliveryDate();
              return replyWith('ValidatePossibleDeliveryDate.DateValidation','options-review',request,po);
            }
            else {
              return po.findDeliveryDateOffers(po.possibleDeliveryDate).then(function(offers){
                if(!offers) return replyWith('Error.ErrorGeneral','die',request,po); //TODO Better error
                return replyWith('ValidatePossibleDeliveryDate.NotAValidDate','query-date',request,po);
              });
            }
          });
        });
      }
    },
    "order-review": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          return replyWith('Options.OrderReview', 'query-order-confirmation', request,po);
        });
      }
    },
    "query-order-confirmation": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if (request.intent.name == 'AMAZON.YesIntent') {
            return po.prepOrderForPlacement().then(function(isValid){
              if(!isValid) return replyWith('Errors.ErrorAtLaunch','die',request,po);
              return replyWith('QueryOrderConfirmation.ConfirmOrder','query-buy-confirmation',request,po);
            });
          }else if (request.intent.name == 'AMAZON.NoIntent') {
            return replyWith('QueryOrderConfirmation.CancelOrder','cancel-order-confirmation',request,po);
          }
        });
      }
    },
    "cancel-order-confirmation": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if (request.intent.name == 'AMAZON.YesIntent') {
            return replyWith('CancelOrderConfirmation.Canceled','die',request,po);
          }else if (request.intent.name == 'AMAZON.NoIntent') {
            return replyWith('queryOrderConfirmation.ConfirmOrder','query-order-confirmation',request,po);
          }
        });
      }
    },
    "clear-and-query-options-again": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          po.possibleRecipient = null;
          return replyWith(null,'query-options-again',request,po);
        });
      }
    },
    "query-options-again": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if (request.intent.name == 'AMAZON.YesIntent') {
            return replyWith('QueryOptionsAgain.Validation','options-review',request,po);
          } else if (request.intent.name == 'AMAZON.NoIntent') {
            return replyWith('QueryOptionsAgain.Close','die',request,po);
          }
        });
      }
    },
    "help-menu": SimpleHelpMessage('Help.HelpStartMenu', 'Start Menu')
  },
  Access: function Access(request) {
    var self = this;
    if (this.access) return Promise.resolve(this.access);
    if (!request || !request.user || !request.user.accessToken) {
      //Allow logging in with fake credentials for debugging
      if (!config.skill.fakeCredentials) {
        analytics(request).event('Main Flow', 'Exit from not authorized').send();
        return Promise.reject(StateMachineSkill.ERRORS.AUTHORIZATION);
      }
      return Promise.try(function () {
        flowers = flowers || Flowers(config.flowers);
        console.log('Using faked credentials. This should never happen in live!');
        return flowers.login(config.skill.fakeCredentials.username, config.skill.fakeCredentials.password).then(function (user) {
          self.access = {
            user: user,
            flowers: flowers,
            analytics: analytics(request)
          };
          return self.access;
        });
      });
    }
    //HERE IS WHERE WE WILL GET AN OAUTH ACCESSTOKEN USING THE DEFAULT CREDENTIALS
    //THEN WE WILL PULL USER DATA BASED ON SYSTEMID STORED IN THE ALEXA REQUEST IN PartialOrder.build()
    return Promise.try(function () {
      flowers = flowers || Flowers(config.flowers);
      console.log('Logging in using default credentials.');
      // TODO We're going to need to make this something that doesn't make a request each time, since it's called often when flowing
      // between states
      return flowers.login(config.skill.defaultCredentials.username, config.skill.defaultCredentials.password).then(function (user) {
        //Store the systemID and customerID that should be in the request.user.accessToken to the user object
        var tokens = oauthhelper.decryptCode(request.user.accessToken);
        user.systemID = tokens.systemID;
        user.customerID = tokens.customerID;
        self.access = {
          user: user,
          flowers: flowers,
          analytics: analytics(request)
        };
        return self.access;
      });
    });
  }
});

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
      return replyWith(msgPath, toState || 'die', request, null);
    }
  };
}

function analytics(request) {
  return universalAnalytics(config.googleAnalytics.trackingCode, request.session.user.userId, { strictCidFormat: false });
}
