'use strict';

var StateMachine = require('./StateMachine.js'),
    currency = require('./currency.js'),
    Reply = require('./reply.js'),
    Flowers = require('../services/Flowers.js'),
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
      analytics(request).timing('Main Flow', 'Session Duration', elapsed).send();
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
        "AMAZON.RepeatIntent": 'repeat',
        "AMAZON.StartOverIntent": 'start-over',
        "AMAZON.HelpIntent": 'help-menu',
        "AMAZON.StopIntent": 'exit',
        "AMAZON.CancelIntent": 'exit'
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
        .then(function(api) {
          return PartialOrder.exists(request);
        })
        .then(function(exists) {
          if (exists) {
            return Promise.reject(StateMachineSkill.ERRORS.BAD_RESPONSE);
          }

          var po = PartialOrder.empty();
          po.possibleRecipient = request.intent.params.recipientSlot;
          po.possibleDeliveryDate = request.intent.params.deliveryDateSlot;
          po.pickArrangement(request.intent.params.arrangementSlot);
          po.pickSize(request.intent.params.sizeSlot);
          return replyWith('Options.OpenResponse', 'options-review', request, po);
        });
      }
    },
    "repeat": {
      enter: function enter(request) {
        return this.Access(request)
          .then(function(api) { return PartialOrder.fromRequest(api,request); })
          .then(function(po) {
            if (request.session.attributes.reply) {
              po.analytics.event('Main Flow', 'Repeat').send();
              return replyWith(request.session.attributes.reply.msgPath, request.session.attributes.reply.state, request, po);
            }
            return replyWith(null, 'launch', request, null);
          });
      }
    },
    "start-over": {
      enter: function enter(request) {
        return this.Access(request)
          .then(function(api){return PartialOrder.fromRequest(api,request); })
          .then(function(po){
            po.analytics.event('Main Flow', 'Start Over').send();
            po = PartialOrder.empty();
            return replyWith(null, 'options-review', request, po);
          });
      }
    },
    "options-review": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          return Promise.all([
              po.getContactBook(),
              po.hasPaymentMethod()
            ])
            .spread(function (contactBook, hasPaymentMethod) {
              if(!po.contactBook.hasContacts()) {
                po.analytics.event('Main Flow', 'Goodbye - No Recipients').send();
                return replyWith('Errors.NoRecipientsInAddressBook', 'die', request, po);
              } 
              if(!hasPaymentMethod) {
                po.analytics.event('Main Flow', 'Goodbye - No Payment Method').send();
                return replyWith('Errors.NoPaymentMethod', 'die', request, po);
              } 
              if(!po.hasRecipient()) {
                po.analytics.event('Main Flow', 'Select Recipient').send();
                if(po.possibleRecipient) return replyWith(null,'validate-possible-recipient',request,po);
                else if(po.hasDeliveryDate() || po.hasArrangement() || po.hasSize()) {
                  return replyWith('Options.RecipientSelectionAlt', 'query-recipient', request,po);
                }
                return replyWith('Options.RecipientSelection','query-recipient',request,po);
              }
              if(!po.hasArrangement()) {
                po.analytics.event('Main Flow', 'Select Arrangement').send();
                return replyWith('Options.ArrangementList', 'query-arrangement-type', request, po);
              }
              if(!po.hasSize()) {
                po.analytics.event('Main Flow', 'Select Size').send();
                return replyWith('Options.SizeList', 'query-size', request, po);
              } 
              if(!po.hasDeliveryDate()) {
                po.analytics.event('Main Flow', 'Select Date').send();
                if(po.possibleDeliveryDate) return replyWith(null,'validate-possible-delivery-date',request,po);
                return replyWith('Options.DateSelection','query-date',request,po);
              }
              po.analytics.event('Main Flow', 'Review Order').send();
              return replyWith(null,'order-review',request,po);
            }), function(promiseRejected) {
              console.log("getContactBook or getPaymentMethod Failed: " + promiseRejected);
              return replyWith('Errors.NoPaymentMethod', 'die', request, po);
            });
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
            if(po.isLastRecipientChoiceOffer()) return replyWith('QueryRecipientList.LastRecipientList','query-recipient-list',request,po);
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
          po.analytics.event('Main Flow', 'Validated Possible Recipient Name').send();
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
            po.analytics.event('Main Flow', 'Address Validated').send();
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
        LaunchIntent: 'arrangement-selection',
        RecipientSelectionIntent: 'arrangement-selection'
      }
    },
    "arrangement-descriptions": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if (request.intent.name == 'DescriptionIntent') {
            po.setupArrangementDescriptions(request.intent.params.arrangementSlot);
            if (verbose) console.log('Current Arrangement ' + po.getArrangementDescription().name);
            if (request.intent.params.arrangementSlot) {
              return replyWith('QueryArrangementType.FirstArrangmentDescription', 'clear-arrangement-description-and-restart', request, po);
            } else {
              return replyWith('QueryArrangementType.FirstArrangmentDescription', 'arrangement-descriptions', request, po);
            }
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
    "clear-arrangement-description-and-restart": {
      enter: function enter(request) {
        return this.Access(request)
          .then(function(api){ return PartialOrder.fromRequest(api,request); })
          .then(function(po) {
            var arrangementSlot = po.getArrangementDescription().name;
            po.clearArrangementDescriptions();
            if (request.intent.name == 'AMAZON.YesIntent') {
              request.intent.params.arrangementSlot = arrangementSlot;
              return replyWith(null, 'arrangement-selection', request, po);
            } else if (request.intent.name == 'AMAZON.NoIntent') {
              return replyWith(null, 'options-review', request, po);
            } else if (request.intent.name == 'DescriptionIntent') {
              return replyWith(null, 'arrangement-descriptions', request, po);
            }
          });
      }
    },
    "arrangement-selection": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          // Some arrangement can be taken as recipients
          if (request.intent.name === 'RecipientSelectionIntent') {
            // We need to map `love` or `romance` to `love and romance`
            var matched = [
              'love'
              , 'romance'
            ]
            var slot = request.intent.params.recipientSlot.toLowerCase() || '';
            if (matched.indexOf(slot) != -1) {
              request.intent.params.arrangementSlot = 'love and romance';
              if (verbose) console.log('Mapping to ' + request.intent.params.arrangementSlot);
            }
          }
          if (request.intent.params && request.intent.params.arrangementSlot) {
            if (verbose) console.log('Arrangement Selection Params ',request.intent.params);
            return po.pickArrangement(request.intent.params.arrangementSlot).then(function (success) {
              if (!success) {
                return replyWith('Errors.ErrorGeneral', 'die', request, po);
              }
              po.analytics.event('Main Flow', 'Arrangement Selected', {arrangement: request.intent.params.arrangementSlot}).send();
              return replyWith('ArrangementSelectionIntent.ArrangementValidation', 'options-review', request, po);
            });
          } else {
            return Promise.reject(StateMachineSkill.ERRORS.BAD_RESPONSE);
          }
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
        LaunchIntent: 'size-selection',
        RecipientSelectionIntent: 'size-selection'
      }
    },
    "size-descriptions": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if (request.intent.name == 'DescriptionIntent') {
            po.setupSizeDescriptions(request.intent.params.sizeSlot);
            if (verbose) console.log('Current Size ' + po.getSizeDescription().name);
            if (request.intent.params.sizeSlot) {
              return replyWith('QuerySize.FirstSizeDescription', 'clear-size-description-and-restart', request, po);
            } else {
              return replyWith('QuerySize.FirstSizeDescription', 'size-descriptions', request, po);
            }
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
    "clear-size-description-and-restart": {
      enter: function enter(request) {
        return this.Access(request)
          .then(function(api){ return PartialOrder.fromRequest(api,request); })
          .then(function(po) {
            var sizeSlot = po.getSizeDescription().name;
            po.clearSizeDescriptions();
            if (request.intent.name == 'AMAZON.YesIntent') {
              request.intent.params.sizeSlot = sizeSlot;
              return replyWith(null, 'size-selection', request, po);
            } else if (request.intent.name == 'AMAZON.NoIntent') {
              return replyWith(null, 'options-review', request, po);
            } else if (request.intent.name == 'DescriptionIntent') {
              return replyWith(null, 'size-descriptions', request, po);
            }
          });
      }
    },
    "size-selection": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if (request.intent.params && request.intent.params.sizeSlot) {
            po.pickSize(request.intent.params.sizeSlot);
            po.analytics.event('Main Flow', 'Size Selected', {size: request.intent.params.sizeSlot}).send();
            return replyWith('SizeSelectionIntent.SizeValidation', 'options-review', request, po);
          } else {
            return Promise.reject(StateMachineSkill.ERRORS.BAD_RESPONSE);
          }
        });
      }
    },
    "date-selection": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          po.possibleDeliveryDate = request.intent.params.deliveryDateSlot;
          if (po.hasRecipient() && po.hasArrangement() && po.hasSize()) {
            return replyWith(null, 'validate-delivery-date', request, po);
          } else {
            return replyWith('ValidatePossibleDeliveryDate.DateValidationAlt', 'options-review', request, po);
          }
        });
      }
    },
    "query-date": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if ((request.intent.name === 'ArrangementSelectionIntent') ||
              (request.intent.name === 'RecipientSelectionIntent')) {
            return replyWith('QueryDate.InvalidDate', 'query-date', request, po);
          }
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
    "validate-delivery-date": {
      enter: function enter(request) {
        return this.Access(request)
          .then(function(api) { return PartialOrder.fromRequest(api,request); })
          .then(function(po) {
            po.deliveryDateOffers = null;
            return po.isDateDeliverable(po.possibleDeliveryDate)
              .then(function(isDeliverable) {
                if(isDeliverable) {
                  po.acceptPossibleDeliveryDate();
                  return replyWith('ValidatePossibleDeliveryDate.DateValidation', 'options-review', request,po);
                }
                else {
                  return po.findDeliveryDateOffers(po.possibleDeliveryDate)
                    .then(function(offers) {
                      if((!offers) || (offers.length === 0)) return replyWith('ValidatePossibleDeliveryDate.NotAValidDateForThisAddress', 'query-date', request,po);
                      return replyWith('ValidatePossibleDeliveryDate.NotAValidDate', 'query-date', request,po);
                    });
                }
              });
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
              po.analytics.event('Main Flow', 'Delivery Date Chosen').send();
              return replyWith(null,'options-review',request,po);
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
              po.analytics.event('Main Flow', 'Order Review Confirmed').send();
              return replyWith('QueryOrderConfirmation.ConfirmOrder','query-buy-confirmation',request,po);
            });
          }else if (request.intent.name == 'AMAZON.NoIntent') {
            po.analytics.event('Main Flow', 'Order Cancelled on Order Review', {size: request.intent.params.sizeSlot}).send();
            return replyWith('QueryOrderConfirmation.CancelOrder','cancel-order-confirmation',request,po);
          }
        });
      }
    },
    "query-buy-confirmation": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.fromRequest(api,request); })
        .then(function(po){
          if (request.intent.name == 'AMAZON.YesIntent') {
            // Once we're good to test `place order` uncommented these 3 lines
            return po.placeOrder().then(function(isValid){
              if(!isValid) {
                po.analytics.event('Main Flow', 'Order Failed').send();
                return replyWith('Errors.ErrorAtOrder','die',request,po);
              } 
              po.analytics.event('Main Flow', 'Order Completed').send();
              var item = po.getSizeDetailsByName();
              var trans = po.analytics.transaction("Alexa Order", po.order.charges.total, po.order.charges.shippingTotal, po.order.charges.taxes);
              trans.item(po.order.charges.item, 1, item.sku);
              trans.send();
              return replyWith('QueryBuyConfirmation.SendToSomeoneElse','clear-and-restart',request,po);
            });
          }else if (request.intent.name == 'AMAZON.NoIntent') {
            po.analytics.event('Main Flow', 'Order Cancelled on Purchase Confirmation').send();
            return replyWith('QueryBuyConfirmation.CancelOrder','cancel-order-confirmation',request,po);
          }
        });
      }
    },
    "clear-and-restart": {
      enter: function enter(request) {
        return this.Access(request)
        .then(function(api){ return PartialOrder.empty(api); })
        .then(function(po){
          return replyWith(null,'query-options-again',request,po)
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
          if (request.intent.name == 'AMAZON.YesIntent' || request.intent.name == 'AMAZON.DescriptionIntent') {
            return replyWith('QueryOptionsAgain.Validation','options-review',request,po);
          } else if (request.intent.name == 'AMAZON.NoIntent') {
            return replyWith('QueryOptionsAgain.Close','die',request,po);
          }
        });
      }
    },
    "help-menu": SimpleHelpMessage('Help.HelpStartMenu', 'Start Menu', 'options-review')
  },
  Access: function Access(request) {
    var self = this;
    if (this.access) return Promise.resolve(this.access);
    if (!request || !request.user || !request.user.accessToken) {
      analytics(request).event('Main Flow', 'Exit from not authorized').send();
      return Promise.reject(StateMachineSkill.ERRORS.AUTHORIZATION);
    }
    //HERE IS WHERE WE WILL GET AN OAUTH ACCESSTOKEN USING THE DEFAULT CREDENTIALS
    //THEN WE WILL PULL USER DATA BASED ON SYSTEMID STORED IN THE ALEXA REQUEST IN PartialOrder.build()
    return Promise.try(function () {
      flowers = flowers || Flowers(config.flowers);
      var tokens = oauthhelper.decryptCode(request.user.accessToken);
      return flowers.buildUser(tokens).then(function (user) {
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
    // For AMAZON.RepeatIntent
    var reply = null;
    if (msg && msg.ask) reply = { msgPath: msgPath, state: state };
    return {
      message: msg,
      to: state,
      session: {
        partialOrder: partialOrder ? partialOrder.serialize() : request.session.attributes.partialOrder,
        startTimestamp: request.session.attributes.startTimestamp,
        reply: reply
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
      //var analytics = universalAnalytics(config.googleAnalytics.trackingCode, request.session.user.userId, { strictCidFormat: false });
      analytics(request).event('Help Flow', analyticEvent).send();
      return replyWith(msgPath, toState || 'die', request, null);
    }
  };
}

function analytics(request) {
  return universalAnalytics(config.googleAnalytics.trackingCode, request.session.user.userId, { strictCidFormat: false });
}
