/**
 * Copyright (C) Crossborders LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * An object to place responses
 *
 * Written by Christijan Draper <christijand@rain.agency> & Matthew Parkin <matthewp@rain.agency>, March 2016
 * Reviewed by Christian Torres <christiant@rain.agency>, March 2016
 */
'use strict';

var responses = function () {

  var authCard = { type: "LinkAccount" };

  return {
    Errors: {

      NotConnectedToAccount: {
        tell: "Before I can help you place an order, you'll need to connect to your 1-800-Flowers account.\n        To help you get started, I've added a link to the authorization process in the Home screen of the Alexa app.\n        <break time=\"1s\"/>\n        When you're ready, come back and I'll be happy to help you place your order!",
        card: authCard
      },
      NoRecipientsInAddressBook: {
        tell: "Before I can help you place an order, you'll need to add at least one address to your 1-800-Flowers address book online.    <break time=\"1s\"/>      When you're ready, come back and I'll be happy to help you place your order!",
      },
      ErrorAtLaunch: {
        tell: "I'm really sorry, but I can't take floral orders right now.\n          <break time=\"1s\"/>\n          Please check back soon and thank you for visiting 1-800-Flowers."
      },
      ErrorGeneral: {
        tell: "Hello, and welcome back to 1-800-Flowers. I'm sorry, I've encountered an issue and I'm unable to take orders at this time.\n          <break time=\"1s\"/>\n          Please check back soon, and thank you for visiting 1-800-Flowers."
      },
      ErrorAtOrder: {
        // {userName} is the user's first name, e.g. Greg or Leigh Anne.
        tell: "I'm sorry {userName}, but there was an error in processing your order and I'm unable to continue at this time.\n          <break time=\"1s\"/>\n          Please check back soon to try your order again, and thank you for visiting 1-800-Flowers."
      },
      ErrorNonPlannedAtLaunch: {
        tell: "I'm sorry, I couldn't understand you. To launch this skill you can say, Alexa ask 1-800-Flowers to order flowers or simply say Alexa open 1-800-Flowers."
      },
    },

    Options: {
      RecipientSelection: {
        ask: "Hi there. Who would you like to send flowers to?",
        reprompt: "Say the person's name to send them flowers or say, (no, someone else) to hear more available contacts."
      },
      ArrangementList: {
        ask: "What type of arrangement would you like?  I have arrangements for Mother's Day, Birthday, Love and Romance, and 'Thank you'.",
        reprompt: "Did you want a Mother's Day, Birthday, Love and Romance, or 'Thank you' arrangement?"
      },
      SizeList: {
        ask: "What arrangement size would you like? Large for {largePrice}, medium for {mediumPrice}, or small for {smallPrice}.",
        reprompt: "Did you want a Large, Medium, or Small arrangement?"
      },
      DateSelection: {
        ask: "When would you like the flowers delivered?",
        reprompt: "To select a date just say 'tomorrow' or 'next Wednesday' or the month and day, like 'March 6th'."
      },
      OrderReview: {
        ask: "For review, I have a {arrangementSize} {arrangementType} arrangement to be delivered to {recipient} on {deliveryDate}. Is that correct?",
        reprompt: "Say, “repeat” to hear your order again or exit to cancel your order. Or, say, “yes” to place your order."
      },
    },

    QueryRecipient: {
      RecipientList: {
        ask: "You can send flower to {recipientChoices}. "+
          " Who would you like to send flowers to?",
        reprompt: "To send flowers to someone else just add them to your address book on 1-800-Flowers.com?"
      },
      FirstFourRecipientList: {
        ask: "Your first four contacts are {recipientChoices}. " +
          " Would you like to send flowers to one of them?",
        reprompt: "Say the person's name to send them flowers or say, (no, someone else) to hear more available contacts."
      },
    },

    QueryOptionsAgain: {
      Validation: {
        say: "{okay}.",
      },
      Close: {
        tell: "Okay, for more floral needs visit 1-800-Flowers.com.",
      },
    },

    ValidatePossibleRecipient: {
      // The {okay} variable consists of the terms, (Okay, Great, Excellent)
      // that are randomly selected to fill the slot.
      FirstAddress: {
        ask: "{okay}, is that {contactCandidateName} at {contactCandidateAddress}?",
        reprompt: "Is {contactCandidateAddress} the correct address for {contactCandidateName}?"
      },
      NotInAddressBook: {
        ask: "I don't see {possibleRecipient} in your address book. Go to 1-800-Flowers.com to add contacts. " +
         "Would you like to send flowers to someone else?",
        reprompt: "To send flowers to someone just say their name."
      },
    },

    QueryRecipientList: {
      OkayWho: {
        ask: "{okay}, Who?",
        reprompt: "Who would you like to send flowers to?"
      },
      NextFourRecipientList: {
        ask: "Your next four contacts are {recipientChoices}. " +
          " Would you like to send flowers to one of them?",
        reprompt: "Say the person's name to send them flowers or say, (no, someone else) to hear more avilable contacts?"
      },
      LastRecipientList: {
        ask: "Your can also send flowers to {recipientChoices}. " +
          " Would you like to send flowers to one of them?",
        reprompt: "To send flowers to someone just say their name."
      },
      ContinueWithOrder: {
        ask: "You can only send flowers to contacts in your 1 800 Flowers address book. Go to 1 800 Flowers.com to add more contacts. "
        + "Would you like to continue with your order?",
        reprompt: "Did you want to continue with your order?",
      },
    },

    QueryAddress: {
      RecipientValidation: {
        say: "{okay}, flowers for {recipient}.",
      },
      AddressNotDeliverable: {
        say: "I'm sorry. Flowers ordered through the 1-800-Flowers Amazon Echo Skill cannot be delivered to that address.",
      },
      NextAddress: {
        ask: "How about flowers for {contactCandidateName} at {contactCandidateAddress}?",
        reprompt: "Is {contactCandidateAddress} the correct address for {contactCandidateName}?"
      },
      AddOrUpdateAddressesOnline: {
      },
      SendToSomeoneElse: {
        ask: "You can only send flowers to contacts in your 1 800 Flowers address book. Go to 1-800-Flowers.com to add more contacts. " +
          "Would you like to send flowers to someone else?",
        reprompt: "To send flowers to someone just say their name."
      },
    },

    QueryArrangementType: {
      FirstArrangmentDescription: {
        ask: "{arrangementDescription} Would you like a {arrangementName} arrangement?",
        reprompt: "Would you like to send a {arrangementName} arrangement?"
      },
      ArrangementListAgain: {
        say: "{okay}, I have arrangements for Mother's Day, Birthday, Love and Romance, and 'Thank you'.",
        reprompt: ""
      },
      MoreArrangmentsOnline: {
        say: "For more arrangement options go to 1-800-Flowers.com.",
      },
      ContinueWithOrder: {
        ask: "Would you like to continue with your order?",
        reprompt: "Did you want to continue with your order?",
      },
    },

    ArrangementDescriptions: {
      NextArrangmentDescription: {
        ask: "{arrangementDescription} Would you like a {arrangementName} arrangement?",
        reprompt: "Would you like to send a {arrangementName} arrangement?"
      },
      MoreArrangmentsOnline: {
        say: "For more arrangement options go to 1-800-Flowers.com.",
      },
      ContinueWithOrder: {
        ask: "Would you like to continue with your order?",
        reprompt: "Did you want to continue with your order?",
      },
    },

    ArrangementSelectionIntent: {
      ArrangementValidation: {
        say: "{okay}, a {arrangementType} arrangement.",
      },
    },

    QuerySize: {
      FirstSizeDescription: {
        ask: "{sizeDescription} Would you like to buy a {size} arrangement for {price}?",
        reprompt: "Would you like to buy a {size} arrangement for {price}?"
      },
      ContinueWithOrder: {
        ask: "Would you like to continue with your order?",
        reprompt: "Did you want to continue with your order?",
      },
    },

    SizeDescriptions: {
      NextSizeDescription: {
        ask: "{sizeDescription} Would you like a {size} arrangement?",
        reprompt: "Would you like to send a {size} arrangement?"
      },
      ContinueWithOrder: {
        ask: "Would you like to continue with your order?",
        reprompt: "Did you want to continue with your order?",
      },
    },

    SizeSelectionIntent: {
      SizeValidation: {
        say: "{okay}, a {arrangementSize} arrangement.",
      },
    },

    QueryDate: {
      DateValidation: {
        say: "{okay}, {deliveryDate}.",
      },
      DateSelectionAgain: {
        ask: "To select a date just say 'tomorrow' or 'next Wednesday' or the month and day, like 'March 6th'.",
        reprompt: "When would you like the flowers delivered?",
      },
      ContinueWithOrder: {
        ask: "Would you like to continue with your order?",
        reprompt: "Did you want to continue with your order?",
      },
    },

    ValidatePossibleDeliveryDate: {
      // The {okay} variable consists of the terms, (Okay, Great, Excellent)
      // that are randomly selected to fill the slot.
      DateValidation: {
        say: "{okay}, {date}.",
      },
      NotAValidDate: {
        say: "{date} is not available for delivery. Would you like to deliver on {dateMinusOne} or {datePlusOne}?",
        reprompt: "To select a date just say 'tomorrow' or 'next Wednesday' or the month and day, like 'March 6th'."
      },
      NotAValidDateOfferNext: {
        say: "{date} is not available for delivery. Would you like to deliver on {nextDate}?",
        reprompt: "To select a date just say 'tomorrow' or 'next Wednesday' or the month and day, like 'March 6th'."
      },
    },

    QueryOrderConfirmation: {
      ConfirmOrder: {
        ask: "Your order total is {price} to be billed to your {paymentType}. Should I place the order?",
        reprompt: "Should I place your order for {price}?"
      },
      CancelOrder: {
        ask: "Would you like to cancel your order?",
        reprompt: "Did you want to cancel your order?",
      },
    },

    QueryBuyConfirmation: {
      PurchaseValidation: {
        say: "I've sent your order. There is a review card in the alexa app and you will receive an email confirmation shortly.",
      },
      CancelOrder: {
        ask: "Would you like to cancel your order?",
        reprompt: "Did you want to cancel your order?",
      },
      SendToSomeoneElse: {
        ask: "Would you like to send flowers to someone else?",
        reprompt: "To send flowers to someone just say their name."
      },
    },

    CancelOrderConfirmation: {
      canceled: {
        tell: "Okay, our order has been canceled.",
      },
      OrderReviewReprompt: {
        ask: "Your order total is {price} to be billed to your {paymentType}. Should I place the order?",
        reprompt: "Should I place your order for {price}?"
      },
    },

    BadInput: {
      // This should replay the reprompt associated with the last ask the user received.
      RepeatLastAskReprompt: {
        say: "",
      },
    },

    Help: {
      HelpStartMenu: {
        tell: "Okay, I'd be happy to help.    <break time=\"1s\"/>\n "
          + "You can send flowers to you contacts in your 1-800 Flowers account."
          + "Just say their name to send them flowers.   <break time=\"1s\"/>\n "
          + "You can add contacts and updates addresses on 1-800 Flowers.com.   <break time=\"1s\"/>\n "
          + "You can select the type of arrangement like; Mother's Day, Birthday, Thank You, or Love and Romance."
          + "You can also choose between small, medium, and large arrangement sizes.    <break time=\"1s\"/>\n "
          + "Lastly, tell me what day you would like the flowers delivered and I will make sure they get there.",
      },
    },

    ExitIntent: {
      // This should replay the reprompt associated with the last ask the user received.
      RepeatLastAskReprompt: {
        tell: "Okay, for more floral needs visit 1-800-Flowers.com?",
      },
    },
  };
}();
module.exports = responses;
