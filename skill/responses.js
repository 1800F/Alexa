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
      NoPaymentMethod: {
        tell: "Before I can help you place an order, you'll need to add a payment method to your 1-800-Flowers account online.    <break time=\"1s\"/>      When you're ready, come back and I'll be happy to help you place your order!",
      },
      ErrorAtLaunch: {
        tell: "I'm really sorry, but I can't take floral orders right now.\n          <break time=\"1s\"/>\n          Please check back soon and thank you for visiting 1-800-Flowers."
      },
      ErrorGeneral: {
        tell: "Hello, and welcome back to 1-800-Flowers. I'm sorry, I've encountered an issue and I'm unable to take orders at this time.\n          <break time=\"1s\"/>\n          Please check back soon, and thank you for visiting 1-800-Flowers."
      },
      ErrorAtOrder: {
        tell: "I'm sorry, but there was an error in processing your order and I'm unable to continue at this time.\n          <break time=\"1s\"/>\n          Please check back soon to try your order again, and thank you for visiting 1-800-Flowers."
      },
      ErrorNonPlannedAtLaunch: {
        tell: "I'm sorry, I couldn't understand you. To launch this skill you can say, Alexa ask 1-800-Flowers to order flowers or simply say Alexa open 1-800-Flowers."
      }
    },

    Options: {
      RecipientSelection: {
        ask: "Who would you like to send flowers to?",
        reprompt: "What's the first name of the person you want to send flowers to?"
      },
      ArrangementList: {
        ask: "I have four types of arrangements available: Mothers Day, Birthday, \"Love and Romance\", and, Thank you. <break time=\"500ms\"/>Which would you like?",
        reprompt: "Did you want an arrangement for someone's birthday, <break time=\"350ms\"/>Mothers Day,<break time=\"350ms\"/> \"Love and Romance\", <break time=\"350ms\"/>or, to say<break time=\"10ms\"/>Thank you?"
      },
      SizeList: {
        //Note to developer: prices in this response should be read without saying dollars or cents unless it is a full dollar amount with no cents (e.g. $45.99 should be read forty-five ninety-nine, but $45.00 should be read forty-five dollars.)
        ask: "We have a Large arrangement for {largePrice}, medium for {mediumPrice}, or small for {smallPrice}. Prices do not include taxes or delivery fees. Which size would you like to order?",
        reprompt: "Did you want a Large, Medium, or Small arrangement?"
      },
      DateSelection: {
        ask: "When would you like the flowers delivered?",
        reprompt: "To select a date just say 'tomorrow' or 'next Wednesday' or the month and day, like 'March 6th'."
      },
      OrderReview: {
        ask: "To review: I have a {arrangementSize} {arrangementType} arrangement to be delivered to {recipient} on {deliveryDate}. " +
          " Is that right?",
        reprompt: "Would you like to place your order?"
      },
    },

    QueryRecipient: {
      RecipientList: {
        ask: "You can send flowers to {recipientChoices}. "+
          " Who would you like to send flowers to?",
        reprompt: "To send flowers to someone else, just add them to your address book on 1-800-Flowers.com."
      },
      FirstFourRecipientList: {
        ask: "Your first four contacts are {recipientChoices}. " +
          "Would you like to send flowers to one of them?",
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
        ask: "I don't see {possibleRecipient} in your address book. You can always go to 1 800 Flowers.com to add new contacts. " +
         " Would you like to send flowers to someone else?",
        reprompt: "To send flowers to someone, just say their first name."
      },
    },

    QueryRecipientList: {
      OkayWho: {
        ask: "{okay}, what’s the first name of the person you want to send flowers to?",
        reprompt: "What is the first name of the person you would like to send flowers to?"
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
        + " Would you like to continue with your order?",
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
        ask: "That is all the addresses i have for recipient. Go to 1-800-Flowers.com to update your contacts. " +
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
        say: "Those are the only arrangement types I have available. Please visit 1-800-Flowers.com to order other arrangements.",
      },
      ContinueWithOrder: {
        ask: "Would you like to hear those arrangements again?",
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
        ask: "{sizeDescription} Would you like to buy a {sizeName} arrangement for {sizePrice} before tax and delivery fees?",
        reprompt: "Would you like to buy a {sizeName} arrangement for {sizePrice} before tax and delivery fees?"
      },
      ContinueWithOrder: {
        ask: "Would you like to continue with your order?",
        reprompt: "Did you want to continue with your order?",
      },
    },

    SizeDescriptions: {
      NextSizeDescription: {
        ask: "{sizeDescription} Would you like a {sizeName} arrangement for {sizePrice} before tax and delivery fee?",
        reprompt: "Would you like to send a {sizeName} arrangement?"
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
        ask: "To select a date you can say 'tomorrow' or 'next Wednesday' or the month and day, like 'March 6th'. What day would you like the flowers delivered?",
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
        say: "{okay}, {deliveryDate}.",
      },
      NotAValidDate: {
        //For developer ... please ensure the logic of this phrase makes sense with the code you create (dateMinusOne should never bring up a non-available date).
        ask: "{possibleDeliveryDate} is not available for delivery. Would you like to deliver on {deliveryDateOffers}?",
        reprompt: "To select a date just say 'tomorrow' or 'next Wednesday' or the month and day, like 'March 6th'."
      }
    },

    QueryOrderConfirmation: {
      ConfirmOrder: {
        ask: "Your order total is {price} including taxes and delivery fee, to be billed to your {paymentType}. Should I place the order?",
        reprompt: "Should I place your order for {price}?"
      },
      CancelOrder: {
        ask: "Okay, what change would you like to make?}",
        reprompt: "Did you want to cancel your order?",
      },
    },

    QueryBuyConfirmation: {
      CancelOrder: {
        ask: "Would you like to cancel your order?",
        reprompt: "Did you want to cancel your order?",
      },
      SendToSomeoneElse: {
        ask: "I've sent your order. There is a review card in the Alexa app and you will receive an email confirmation shortly. \n" +
             "Would you like to send flowers to someone else?",
        reprompt: "To send flowers to someone just say their name."
      },
    },

    CancelOrderConfirmation: {
      Canceled: {
        tell: "Okay, your order has been canceled.",
      }
    },

    BadInput: {
      // This should replay the reprompt associated with the last ask the user received.
      RepeatLastAskReprompt: {
        say: "I'm sorry. I didn't understand.",
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
        tell: "Okay, for more floral needs visit 1-800-Flowers.com.",
      },
    },
  };
}();
module.exports = responses;
