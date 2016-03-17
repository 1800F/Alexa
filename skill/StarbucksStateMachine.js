'use strict';

var StateMachine = require('./StateMachine.js'),
    currency = require('./currency.js'),
    Reply = require('./reply.js'),
    alexaStarbucks = require('../services/alexa-starbucks.js'),
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
    universalAnalytics = require('universal-analytics');

var starbucks = null;

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
    return new Reply(_.at(responses, 'Errors.UserNotAuthorized')[0]);
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
        HelpIntent: 'help-menu',
        HelpHowToOrderIntent: 'HelpAboutOrder',
        HelpCheckBalanceIntent: 'HelpBalanceCheck',
        HelpOtherOptions: 'HelpOtherMenu',
        HelpSVCAdjustIntent: 'HelpAdjustStarbucksCard',
        HelpPaymentChangeIntent: 'HelpAdjustPayment',
        HelpLocationAdjustIntent: 'HelpAdjustLocation',
        HelpOrderAdjustIntent: 'HelpAdjustOrder',
        HelpSettingsAdjustIntent: 'HelpAdjustSettings',
        HelpReloadIntent: 'HelpReloadCard',
        LaunchIntent: 'launch',
        OrderSpecificRedirectIntent: 'order-specific-redirect',
        ItemAdjustmentRedirectIntent: 'adjustment-specific-redirect',
        LocationSpecificRedirectIntent: 'location-specific-redirect',
        ChangeLocationIntent: 'change-store',
        ExitIntent: 'exit'
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
    'more-help-query': {
      enter: function enter(request) {
        if (request.intent.name == 'HelpIntent' || request.intent.name == 'YesIntent') return replyWith('Help.HelpMenuRestart', 'more-help-query', request, null);
        if (request.intent.name == 'NoIntent') return replyWith(null, 'launch', request, null);
        if (request.intent.name == 'ExitIntent') return replyWith(null, 'exit', request, null);
        return replyWith(null,'launch',request,null);
      }
    },
    "help-menu": SimpleHelpMessage('Help.HelpStartMenu', 'Start Menu'),
    "HelpAdjustStarbucksCard": SimpleHelpMessage('Help.HelpAdjustStarbucksCard', 'Adjust Starbucks Card'),
    "HelpAboutOrder": SimpleHelpMessage('Help.HelpAboutOrder', 'About Order'),
    "HelpReloadCard": SimpleHelpMessage('Help.HelpReloadCard', 'Reload'),
    "HelpAdjustSettings": SimpleHelpMessage('Help.HelpAdjustSettings', 'Adjust Settings'),
    "HelpAdjustOrder": SimpleHelpMessage('Help.HelpAdjustOrder', 'Adjust Order'),
    "HelpAdjustLocation": SimpleHelpMessage('Help.HelpAdjustLocation', 'Adjust Location'),
    "HelpOtherMenu": SimpleHelpMessage('Help.HelpOtherMenu', 'Other Menu'),
    "HelpBalanceCheck": {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          po.getBalance(); //Kick off now for responses to pick up
          po.analytics.event('Help Flow', 'Balance Check').send();
          return replyWith('Help.HelpBalanceCheck', 'more-help-query', request, po);
        });
      }
    },
    "HelpAdjustPayment": SimpleHelpMessage('Help.HelpAdjustPayment', 'Adjust Payment', 'new-payment-method-query'),
    "new-payment-method-query": {
      enter: function enter(request) {
        if (request.intent.name == 'YesIntent') {
          return replyWith('Help.HelpNewPayment', 'more-help-query', request, null);
        } else if (request.intent.name == 'NoIntent') {
          return replyWith(null, 'more-help-query', request, null);
        }
      }
    },
    "change-store": {
      enter: function enter(request) {
        if (request.session.attributes.partialOrder) {
          return this.Access(request).then(function (user) {
            return PartialOrder.fromRequest(user, request);
          }).then(function (po) {
            return replyWith(null, 'loc-adjust', request, po);
          });
        }
        else return replyWith(null,'launch',request,null);
      }
    },
    "location-specific-redirect": {
      enter: function enter(request) {
        if (request.session.attributes.partialOrder) {
          return this.Access(request).then(function (user) {
            return PartialOrder.fromRequest(user, request);
          }).then(function (po) {
            return replyWith('LocationIssues.LocationSpecificRedirect', 'loc-adjust-or-die-query', request, po);
          });
        } else return replyWith(null, 'launch', request, null);
      }
    },
    "order-specific-redirect": {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          return replyWith('ItemIssues.ItemSpecificRedirect', 'launch-or-die-query', request, po);
        });
      }
    },
    "adjustment-specific-redirect": {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          return replyWith('ItemIssues.AdjustmentSpecificRedirect', 'launch-or-die-query', request, po);
        });
      }
    },
    "loc-adjust-or-die-query": {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent') {
            return replyWith(null, 'loc-adjust', request, po);
          } else if (request.intent.name == 'NoIntent') {
            po.analytics.event('Main Flow', 'Exit From Location Adjust').send();
            return replyWith('Exit.NoFromLocation', 'die', request, po);
          }
        });
      }
    },
    "launch-or-die-query": {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent') {
            return replyWith(null, 'launch', request, po);
          } else if (request.intent.name == 'NoIntent') {
            return replyWith('Exit.NoFromItemRedirect', 'die', request, po);
          }
        });
      }
    },
    "launch": {
      enter: function enter(request) {
        // The enter function will yield back a new state, and may also supply responses
        return this.Access(request).then(PartialOrder.build).then(function (po) {
          if (po.hasNoItems()) {
            return replyWith('ItemIssues.NoItemsNoOtherOrder', 'die', request, po);
          } else if (po.fallback) {
            po.setFlag('exit-style', 'other order');
            if (po.fallback.explanation == 'seasonal') return replyWith('ItemIssues.NoItemsAnotherOrderSeasonal', 'accept-order-or-exit', request, po);
            if (po.fallback.explanation == 'permanent') return replyWith('ItemIssues.NoItemsAnotherOrderPermanent', 'accept-order-or-exit', request, po);
            return replyWith('ItemIssues.NoItemsAnotherOrderTempGen', 'accept-order-or-exit', request, po);
          } else if (po.mode == 'detached') {
            if (po.noStoreAvailableExplanation) {
              if (po.noStoreAvailableExplanation.reason == 'closed') return replyWith('LocationIssues.PrevLocIssueAllHours', 'die', request, po);else if (po.noStoreAvailableExplanation.reason == 'inactive') return replyWith('LocationIssues.PrevLocIssueAllGeneral', 'die', request, po);else return replyWith('ItemIssues.NoItemsNoOtherOrder', 'die', request, po);
            } else {
              if (po.hasMultipleItems()) return replyWith('LocationIssues.PrevLocIssueLastMultItems', 'accept-loc-or-next', request, po);else return replyWith('LocationIssues.PrevLocIssueLastOneItem', 'accept-loc-or-next', request, po);
            }
          } else if (isHelpState(request.from)) {
            if (po.hasMultipleItems()) return replyWith('Greeting.ReturnFromHelpMenuMultiple', 'list-or-loc-adjust', request, po)
              ;else return replyWith('Greeting.ReturnFromHelpMenuOne', 'greeting-accept-query', request, po);
          } else {
            if (po.hasMultipleItems()) return replyWith('Greeting.MultipleItems', 'list-or-loc-adjust', request, po);
            else return replyWith('Greeting.OneItem', 'greeting-accept-query', request, po);
          }
        });
      }
    },
    "list-or-loc-adjust": {
      to: {
        ListItemsIntent: 'order-adjust',
        ChangeLocationIntent: 'loc-adjust'
      }
    },
    "order-adjust": {
      enter: function enter(request) {
        var self = this;
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          return po.getProductNames().then(function () {
            return po;
          });
        }) //We're going to need names for everything to move forward
        .then(function (po) {
          return po.validateAndEditOrder().then(function (edits) {
            if (edits.anyRemoved) {
              if (po.hasMultipleItems()) return replyWith('ItemIssues.ItemsNotAvailable', 'remove-or-accept', request, po);
              if (po.getFlag('has-done-loc-adjust')) {
                return po.getPricing().then(function (pricing) {
                  return replyWith('ItemIssues.ItemsNotAvailableAndOneLeftConfirmNext', 'confirm-query', request, po);
                });
              }
              return replyWith('ItemIssues.ItemsNotAvailableAndOneLeft', 'accept-or-loc-adjust', request, po);
            } else return replyWith('ListAdjustOrder.ItemListStart', 'remove-or-accept', request, po);
          });
        });
      }
    },
    "remove-or-accept": {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent') {
            po.startOrderAdjust();
            return replyWith(null, 'order-item-check', request, po);
          } else if (request.intent.name == 'NoIntent') {
            if (po.getFlag('has-done-loc-adjust')) return replyWith(null, 'confirm', request, po);
            return replyWith('ListAdjustLocation.LocationConfirm', 'accept-or-loc-adjust', request, po);
          }
        });
      }
    },
    "order-item-check": {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          return po.getProductNames().then(function () {
            return po;
          });
        }) //We're going to need names for everything to move forward
        .then(function (po) {
          if (po.hasMoreOrderAdjustItem()) {
            return replyWith('ListAdjustOrder.IndividualItemCheck', 'remove-query', request, po);
          } else {
            if (po.hasOrderChangedInOrderAdjust()) return replyWith('ListAdjustOrder.AdjustedOrderRepeat', 'is-order-correct-query', request, po);
            return replyWith('ListAdjustOrder.NonAdjustedOrderRepeat', 'is-order-correct-query', request, po);
          }
        });
      }
    },
    "remove-query": {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent') {
            po.removeAndNextOrderAdjustItem();
            if (po.currentOrderAdjustItemIsForced()) return replyWith('ListAdjustOrder.RemovedItemOnlyOneLeft', 'is-order-correct-query', request, po);
            return replyWith('ListAdjustOrder.RemovedItemConfirmMore', 'order-item-check', request, po);
          } else if (request.intent.name == 'NoIntent' || request.intent.name == 'NextIntent') {
            po.nextOrderAdjustItem();
            return replyWith(null, 'order-item-check', request, po);
          }
        });
      }
    },
    "is-order-correct-query": {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent') {
            po.commitOrderAdjust();
            if (po.getFlag('has-done-loc-adjust')) return replyWith(null, 'confirm', request, po);
            return replyWith('ListAdjustLocation.LocationConfirm', 'accept-or-loc-adjust', request, po);
          } else if (request.intent.name == 'NoIntent' || request.intent.name == 'NextIntent') {
            po.revertOrderAdjust();
            return replyWith('ListAdjustOrder.ListRevertBeginning', 'remove-or-accept', request, po);
          }
        });
      }
    },
    "accept-or-loc-adjust": {
      to: {
        YesIntent: 'confirm',
        NoIntent: 'loc-adjust'
      }
    },
    'accept-order-or-exit': {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent') {
            if (po.hasMultipleItems()) return replyWith(null, 'order-adjust', request, po);
            return replyWith(null, 'confirm', request, po);
          } else if (request.intent.name == 'NoIntent') {
            if ('other order' == po.getFlag('exit-style')) {
              po.analytics.event('Main Flow', 'Exit From Fallback').send();
              return replyWith('Exit.NoFromNoItemOtherOrder', 'die', request, po);
            }
            po.analytics.event('Main Flow', 'Exit From Location Adjust').send();
            return replyWith('Exit.NoFromLocation', 'die', request, po);
          }
        });
      }
    },
    'greeting-accept-query': {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent') {
            return replyWith(null, 'confirm', request, po);
          } else if (request.intent.name == 'NoIntent') {
            return replyWith('ItemIssues.OneItemUserSaysNoAtGreeting', 'change-store-query', request, po);
          }
        });
      }
    },
    'change-store-query': {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent' || request.intent.name == 'ChangeLocationIntent') {
            return replyWith(null, 'loc-adjust', request, po);
          } else if (request.intent.name == 'NoIntent') {
            po.analytics.event('Main Flow', 'Exit From Confirmation').send();
            return replyWith('Exit.NoFromConfirmation', 'die', request, po);
          }
        });
      }
    },
    'confirm': {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          return po.getPricing().then(function (pricing) {
            return replyWith('FinalConfirmation.ItemsLocPrice', 'confirm-query', request, po);
          });
        });
      }
    },
    'success': { isTerminal: true },
    'die': { isTerminal: true },
    'confirm-query': {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent') {
            return po.placeOrder().then(function (success) {
              if (success) return replyWith('OrderSuccess.GeneralThanksOrderDetails', 'die', request, po);else return replyWith('PaymentIssues.NeedsToReload', 'reload-query', request, po);
            });
          } else if (request.intent.name == 'NoIntent') {
            return replyWith('FinalConfirmation.AskOrderRevert', 'start-over-query', request, po);
          }
        });
      }
    },
    'start-over-query': {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent') {
            po = PartialOrder.empty({ user: po.user, starbucks: po.starbucks });
            return replyWith(null, 'launch', request, po);
          }
          else if (request.intent.name == 'ChangeLocationIntent') {
            return replyWith(null, 'loc-adjust', request, po);
          } else if (request.intent.name == 'NoIntent') {
            po.analytics.event('Main Flow', 'Exit From Confirmation').send();
            return replyWith('Exit.NoFromConfirmation', 'die', request, po);
          }
        });
      }
    },
    'reload-query': {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent' || request.intent.name == 'ReloadIntent') {
            return po.reloadAndOrder().then(function () {
              return replyWith('OrderSuccess.FromReloadThanksOrderDetails', 'success', request, po);
            }).catch(function (err) {
              if (verbose) console.log('Failed to reload card due to ', err.stack || err.body);
              po.analytics.event('Main Flow', 'Exit From Payment Issue').send();
              return replyWith('PaymentIssues.CreditCardIssue', 'die', request, po);
            });
          } else if (request.intent.name == 'NoIntent') {
            po.analytics.event('Main Flow', 'Exit From Reload Prompt').send();
            return replyWith('Exit.NoFromConfirmation', 'die', request, po);
          }
        });
      }
    },
    'loc-adjust': {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          po.setFlag('has-done-loc-adjust', true);
          return po.startLocAdjust().then(function (stores) {
            if (stores.length <= 1) {
              po.setFlag('exit-style', 'location');
              return replyWith("ListAdjustLocation.LocationOnlyOne", 'accept-order-or-exit', request, po);
            } else {
              return replyWith('ListAdjustLocation.LocationListStart', 'accept-loc-or-next', request, po);
            }
          });
        });
      }
    },
    'accept-loc-or-next': {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent') {
            po.acceptLocAdjust();
            if (po.hasMultipleItems()) return replyWith('ListAdjustLocation.UserChangesLocationFirst', 'order-adjust', request, po);
            return replyWith(null, 'confirm', request, po);
          } else if (request.intent.name == 'NoIntent' || request.intent.name == 'NextIntent') {
            po.nextLocAdjustLoc();
            if (!po.hasMoreLocAdjustLocs()) {
              po.discardLocAdjust();
              return replyWith('ListAdjustLocation.LocationListEnd', 'repeat-loc-adjust-or-exit', request, po);
            } else if (po.isOnLastLocAdjustLoc()) {
              return replyWith('ListAdjustLocation.LocationListLast', 'accept-loc-or-next', request, po);
            }
            return replyWith('ListAdjustLocation.LocationListMiddle', 'accept-loc-or-next', request, po);
          }
        });
      }
    },
    'repeat-loc-adjust-or-exit': {
      enter: function enter(request) {
        return this.Access(request).then(function (user) {
          return PartialOrder.fromRequest(user, request);
        }).then(function (po) {
          if (request.intent.name == 'YesIntent') {
            return replyWith(null, 'loc-adjust', request, po);
          } else if (request.intent.name == 'NoIntent') {
            po.analytics.event('Main Flow', 'Exit From Location Adjust').send();
            return replyWith('Exit.NoFromLocation', 'die', request, po);
          }
        });
      }
    }
  },
  Access: function Access(request) {
    var self = this;
    if (this.access) return Promise.resolve(this.access);
    if (!request || !request.user || !request.user.accessToken) {
      if (!config.skill.fakeCredentials) {
        var analytics = universalAnalytics(config.googleAnalytics.trackingCode, request.session.user.userId, { strictCidFormat: false });
        analytics.event('Main Flow', 'Exit from not authorized').send();
        return Promise.reject(StateMachineSkill.ERRORS.AUTHORIZATION);
      }
      return Promise.try(function () {
        starbucks = starbucks || Flowers(config.starbucks);
        console.log('Using faked credentials. This should never happen in live!');
        return starbucks.login(config.skill.fakeCredentials.username, config.skill.fakeCredentials.password).then(function (user) {
          self.access = {
            user: user,
            starbucks: starbucks,
            analytics: universalAnalytics(config.googleAnalytics.trackingCode, request.session.user.userId, { strictCidFormat: false })
          };
          return self.access;
        });
      });
    }
    starbucks = starbucks || Flowers(config.starbucks);
    this.access = {
      user: FlowersUser(config.starbucks, request.user.accessToken),
      starbucks: starbucks,
      analytics: universalAnalytics(config.googleAnalytics.trackingCode, request.session.user.userId, { strictCidFormat: false })
    };
    return Promise.resolve(this.access);
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
