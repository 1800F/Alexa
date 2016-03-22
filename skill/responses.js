/* 
 * Copyright (C) Crossborders LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Written by Christian Torres <christiant@rain.agency>, March 2016
 */
'use strict';

var responses = function () {

  var authCard = { type: "LinkAccount" };

  return {
    "Errors": {
      UserNotAuthorized: {
        tell: "I'm sorry, but before I can place your order, you'll have to authorize this skill.\n        To help you get started, I've added a link to the authorization process in the Home screen of the Alexa app.\n        <break time=\"1s\"/>\n        When you're ready, come back and I'll be happy to help you place your order!",
        card: authCard
      },
      ErrorAtLaunch: {
        tell: "Hello, and welcome back to 1-800-Flowers. I'm sorry, but I'm unable to take orders at this time.\n          <break time=\"1s\"/>\n          Please check back soon and thank you for visiting 1-800-Flowers."
      },

      ErrorGeneral: {
        tell: "Hello, and welcome back to 1-800-Flowers. I'm sorry, I've encountered an issue and I'm unable to take orders at this time.\n          <break time=\"1s\"/>\n          Please check back soon, and thank you for visiting 1-800-Flowers."
      },

      ErrorAtOrder: {
        tell: "I'm sorry {userName}, but there was an error in processing your order and I'm unable to continue at this time.\n          <break time=\"1s\"/>\n          Please check back soon to try your order again, and thank you for visiting 1-800-Flowers."
      },

    ErrorNonPlannedAtLaunch: {
        tell: "I'm sorry, I couldn't understand you. To launch this skill you can say, Alexa ask 1-800-Flowers to to start my order or simply say Alexa open 1-800-Flowers."
      }
    },

    Greeting: {
      /*Note for developer, {userName} is the user's first name, ie Greg or Leigh Anne.
       * {orderItem} is the first/only item in order, {orderLocation} is previous MOP location
       */
      OneItem: {
        ask: "{greetingDayReference} {userName}. Welcome back to 1-800-Flowers.\n        Can I get {orderItem} from our store at {orderLocation} started for you?",
        reprompt: "I can help you place your last order by using Mobile Order and Pay. Can I get a {orderItem} from our store at {orderLocation} started for you?"
      },
      /*Note for developer, {totalItems} is the total number of items */
      MultipleItems: {
        ask: "{greetingDayReference} {userName}. Welcome back to 1-800-Flowers.\n        Your most recent order from our coffeehouse at {orderLocation} included {totalItems} items.\n        I can list these items for you or I can change your store. Which would you prefer?",
        reprompt: "I can help you place your last order via Mobile Order and Pay. You had {totalItems} items in your last order from the 1-800-Flowers at {orderLocation}. I can list these items for you or I can change your store. Which would you prefer?"
      },

      ReturnFromHelpMenuOne: {
        ask: "Welcome back {userName}. Can I get a {orderItem} from our store at\n        {orderLocation} started for you?",
        reprompt: "Welcome back {userName}. Can I get a {orderItem} from our store\n        at {orderLocation} started for you?"
      },

      ReturnFromHelpMenuMultiple: {
        ask: "Welcome back {userName}. Your most recent order from our coffeehouse at\n        {orderLocation} included {totalItems} items. I can list these items for you or\n        I can change your store. Which would you prefer?",
        reprompt: "Welcome back {userName}. Your most recent order from our coffeehouse at {orderLocation} included {totalItems} items. I can list these items for you or I can change your store. Which would you prefer?"
      }
    },

    ListAdjustOrder: {
      /*Note for developer, {orderItemList} refers to a list of all items in order.
      * Each item should be preceded by a or an or a number based on what the item is,
      * ie a Tall Mocha, an Orange Scone, 3 pumpkin scones. */
      ItemListStart: {
        ask: "Your most recent order included {anOrderItemList}." + '<break time="1s"/>' + "Would you like to remove any of these items?",
        reprompt: "Your most recent order included {anOrderItemList}." + '<break time="1s"/>' + "Would you like to remove any of these items?"
      },
      /*Note for developer, {orderItem} is the first/only item in order */
      IndividualItemCheck: {
        ask: "Would you like to remove the {orderItemToRemove}?",
        reprompt: "Would you like to remove the {orderItemToRemove}?"
      },

      RemovedItemConfirmMore: {
        say: "My pleasure. I've removed that item and adjusted your order. <break time=\"1s\"/>"
      },

      RemovedItemOnlyOneLeft: {
        ask: "My pleasure. I've removed that item and adjusted your order.\n        <break time=\"1s\"/>\n        Since there's only one item remaining in your order, I cannot remove it.\n        Your adjusted order is {anOrderItemList}. Is that correct?",
        reprompt: "Since there's only one item remaining in your order, I cannot remove it. Your adjusted order is {anOrderItemList}. Is that correct?"

      },

      /*
      * Otherwise if user has gone through list and NOT removed items use NonAdjustedOrderRepeat.
      * If user says YES go to next step, if they say NO then move to ListRevertBeginning */
      AdjustedOrderRepeat: {
        ask: "Your adjusted order is now {anOrderItemList}. Is that correct?",
        reprompt: "Your adjusted order is now {anOrderItemList}. Is that correct?"
      },

      NonAdjustedOrderRepeat: {
        ask: "You chose not to remove any items. Your order is still {anOrderItemList}. Is that correct?",
        reprompt: "Your order is {anOrderItemList}. Is that correct?"
      },

      ListRevertBeginning: {
        ask: "I'm sorry. Let me start from the beginning and make sure I get this right. Your order includes {anOrderItemList}.\n          <break time=\"1s\"/>\n          Would you like to remove any of of these items?",
        reprompt: "Your order includes {anOrderItemList}." + '<break time="1s"/>' + "Would you like to remove any of of these items?"
      }
    },

    ListAdjustLocation: {
      /*Note for developer, {totalLocations} is the total number of locations the user has if the list is greater than 1. If the list is not greater than one, instead of playing this message, play LocationOnlyOne; {orderLocation} in this case is the second location. */
      LocationListStart: {
        ask: "I'll provide you with {totalLocAdjustLocations} stores that you've recently ordered from using Mobile Order and Pay.\n        Would you like to pick up your order from the 1-800-Flowers at {locAdjustOrderLocation}?",
        reprompt: "Would you like to pick up your order from the store at {locAdjustOrderLocation}"
      },

      LocationListMiddle: {
        ask: "You've also ordered from the 1-800-Flowers at {locAdjustOrderLocation}. Would you like to select this store?",
        reprompt: "Would you like to pick up your order from the store at {locAdjustOrderLocation}"
      },

      LocationListLast: {
        ask: "The only other store in your list is the 1-800-Flowers you ordered from at {locAdjustOrderLocation}. Would you like to select this store?",
        reprompt: "Would you like to pick up your order from the store at {locAdjustOrderLocation}"
      },

      LocationListEnd: {
        ask: "I've listed every store that you've previously ordered from using Mobile Order and Pay. Would you like me to repeat the list?",
        reprompt: "Would you like me to repeat the list of stores you've previously ordered from?"
      },

      LocationOnlyOne: {
        ask: "I'm sorry, but I cannot change your store because I can only help you reorder items from\n        1-800-Flowers coffeehouses that you've previously ordered from using Mobile Order and Pay.\n        <break time=\"1s\"/>\n        Can I get a {orderItem} from our store at {orderLocation} started for you?",
        reprompt: "I'm sorry, but I cannot change your store because I can only help you reorder items from 1-800-Flowers coffeehouses that you've previously ordered from using Mobile Order and Pay." + '<break time="1s"/>' + "Can I get a {orderItem} from our store at {orderLocation} started for you?"
      },

      LocationConfirm: {
        ask: "And would you still like to pick up your order at the 1-800-Flowers at {orderLocation}?",
        reprompt: "Would you still like to pick up your order at the 1-800-Flowers at {orderLocation}?"
      },

      UserChangesLocationFirst: {
        say: "Ok, I've changed your store to the 1-800-Flowers at {orderLocation}. <break time=\"1s\"/>"
      }
    },

    LocationIssues: {

      PrevLocIssueLastOneItem: {
        ask: "{greetingDayReference} {userName}. Welcome back to 1-800-Flowers.\n        The most recent order you made using Mobile Order and Pay was {anOrderItemList} from the 1-800-Flowers at {orderLocation}.\n        However, that store is currently unavailable, so I'll offer a few options of 1-800-Flowers you've visited recently.\n        <break time=\"1s\"/>\n        Would you like to order your {orderItem} from the 1-800-Flowers at {locAdjustOrderLocation}?",
        reprompt: "Since the 1-800-Flowers at {orderLocation} is not available,\n        would you like to order your {orderItem} from the 1-800-Flowers at {locAdjustOrderLocation}?"
      },

      PrevLocIssueLastMultItems: {
        ask: "{greetingDayReference} {userName}. Welcome back to 1-800-Flowers.\n        The most recent order you made using Mobile Order and Pay was {totalItems}\n        items from the 1-800-Flowers at {orderLocation}. However, that store is currently unavailable,\n        so I'll offer a few options of 1-800-Flowers you've visited recently.\n        <break time=\"1s\"/>\n        Would you like to place your order from the 1-800-Flowers at {locAdjustOrderLocation}?",
        reprompt: "Since the 1-800-Flowers at {orderLocation} is not available, would you like to place your order from the 1-800-Flowers at {locAdjustOrderLocation}?"
      },
      /*Note for developer, {orderLocationOpenHour} is the time when the {orderLocation} opens if that information is available. It should include am or pm designation in response, but assume it is am.
      */
      PrevLocIssueAllHours: {
        tell: "{greetingDayReference} {userName}. Welcome back to 1-800-Flowers. I'm sorry, but all of the stores you've previously ordered\n        from using Mobile Order and Pay are unable to take orders at this time.\n        <break time=\"1s\"/>\n        Your most recent order with Mobile Order and Pay was at the 1-800-Flowers at {orderLocation},\n        which will reopen at {orderLocationOpenHour}.\n        <break time=\"1s\"/>\n        Thanks again, {userName}. And have a {goodbyeDayReference}!"
      },

      PrevLocIssueAllGeneral: {
        tell: "{greetingDayReference} {userName}. Welcome back to 1-800-Flowers. I'm sorry, but all of the stores you've previously\n        ordered from using Mobile Order and Pay are unable to take orders at this time.\n        <break time=\"1s\"/>\n        Please check back soon, {userName}, and thank you for visiting 1-800-Flowers."
      },

      LocationSpecificRedirect: {
        ask: "I'm sorry, at this time, I'm not able to respond to your request for a specific store.\n        But I can walk you through the list of stores from which you have previously placed an order\n        using Mobile Order and Pay. Would you like to hear this list of stores?",
        reprompt: "Would you like to hear the list of stores you have previously placed an order using Mobile Order and Pay?"
      }
    },

    ItemIssues: {

      ItemsNotAvailable: {
        ask: "I'm sorry, but the {orderItemNotAvailable} {prunedItemsIsOrAre} currently unavailable,\n          so I've removed {prunedItemsThatItemOrThoseItems} from your order.\n          Your order now includes {anOrderItemList}.\n          <break time=\"1s\"/>\n          Would you like to remove any of these items from your order?",
        reprompt: "Your order now includes {anOrderItemList}. Would you like to remove any of these items from your order?"
      },

      ItemsNotAvailableAndOneLeft: {
        ask: "I'm sorry, but the {orderItemNotAvailable} {prunedItemsIsOrAre} currently unavailable,\n          so I've removed {prunedItemsThatItemOrThoseItems} from your order.\n          Your order now includes {anOrderItemList}.\n          <break time=\"1s\"/>\n          Would you still like to pick up your order at the 1-800-Flowers at {orderLocation}?",
        reprompt: "Your order now includes {anOrderItemList}. Would you still like to pick up your order at the 1-800-Flowers at {orderLocation}?"
      },

      ItemsNotAvailableAndOneLeftConfirmNext: {
        ask: "I'm sorry, but the {orderItemNotAvailable} {prunedItemsIsOrAre} currently unavailable,\n          so I've removed {prunedItemsThatItemOrThoseItems} from your order.\n          Just to confirm, your order is {orderItemList} from our store at {orderLocation}.\n          <break time=\"1s\"/>\n          Your total with tax is {orderPrice} and will be charged to your primary 1-800-Flowers Card.\n          May I place this order for you?",
        reprompt: "Your order is {aOrAnOrNumber} {orderItem} from our store at {orderLocation}. Your total with tax is {orderPrice} and will be charged to your primary 1-800-Flowers Card. May I place this order for you?"
      },

      OneItemUserSaysNoAtGreeting: {
        ask: "Since there's only one item remaining in your order, I cannot remove it,\n          but I can help you change where you pick it up.\n          <break time=\"1s\"/>\n          Would you like me to help you change your store?",
        reprompt: "Would you like me to help you change your store?"
      },

      NoItemsAnotherOrderTempGen: {
        ask: "{greetingDayReference}, {userName}. Welcome back to 1-800-Flowers. I'm sorry, but the {fallbackItems}\n        from your most recent order using Mobile Order and Pay {fallbackItemsIsAre} temporarily unavailable.\n        <break time=\"1s\"/>\n        Instead, would you like to reorder your {orderItemList} from the 1-800-Flowers at {orderLocation}?",
        reprompt: "{greetingDayReference}, {userName}. Welcome back to 1-800-Flowers. I'm sorry, but the {orderItemNotAvailable} from your most recent order using Mobile Order and Pay is temporarily unavailable." + '<break time="1s"/>' + "Instead, would you like to reorder your {anOrderItemList} from the 1-800-Flowers at {orderLocation}?"
      },

      NoItemsNoOtherOrder: {
        tell: "{greetingDayReference}, {userName}. Welcome back to 1-800-Flowers. I'm sorry, but the {orderItemNotAvailable}\n        from your most recent order using Mobile Order and Pay is temporarily unavailable.\n        Please come back later to place this order.\n        <break time=\"1s\"/>\n        If you would rather order something else, simply download and login to the 1-800-Flowers Mobile app.\n        <break time=\"1s\"/>\n        You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store.\n        <break time=\"1s\"/>\n        Once you've picked up your order, I'd be happy to help you reorder it again anytime.\n        <break time=\"1s\"/>\n        Thank you {userName}. And have a {goodbyeDayReference}!"
      },

      NoItemsAnotherOrderSeasonal: {
        ask: "{greetingDayReference}, {userName}. Welcome back to 1-800-Flowers. I'm sorry {userName}, the {fallbackItems}\n        in your most recent order using Mobile Order and Pay is a seasonal item.\n        <break time=\"1s\"/>\n        Instead, would you like to reorder your {orderItemList} from the 1-800-Flowers at {orderLocation}?",
        reprompt: "I'm sorry {userName}, the {orderItemNotAvailable} in your most recent order using Mobile Order and Pay is a seasonal item." + '<break time="1s"/>' + "Instead, would you like to reorder your {orderItemList} from the 1-800-Flowers at {orderLocation}?"
      },

      NoItemsAnotherOrderPermanent: {
        ask: "{greetingDayReference}, {userName}. Welcome back to 1-800-Flowers. I'm sorry {userName}, unfortunately the {fallbackItems}\n        in your previous order using Mobile Order and Pay {fallbackItemsIsAre} no longer available.\n        <break time=\"1s\"/>\n        Instead would you like to reorder your {orderItemList} from the 1-800-Flowers at {orderLocation}?",
        reprompt: "I'm sorry {userName}, unfortunately the {orderItemNotAvailable} in your previous order using Mobile Order and Pay is no longer available." + '<break time="1s"/>' + "Instead would you like to reorder your {orderItemList} from the 1-800-Flowers at {orderLocation}?"
      },

      ItemSpecificRedirect: {
        ask: "I'm sorry, but at this time, I can only help you order items that were in your previous order using Mobile Order and Pay.\n        <break time=\"1s\"/>\n        May I repeat your previous order for you?",
        reprompt: "May I repeat your previous order for you?"
      },

      AdjustmentSpecificRedirect: {
        ask: "I'm sorry, but at this time, I'm unable to make modifications to your items.\n        I can only help you reorder the exact items that were in your previous order using Mobile Order and Pay.\n        <break time=\"1s\"/>\n        May I repeat your previous order for you?",
        reprompt: "May I repeat your previous order for you?"
      }
    },

    FinalConfirmation: {
      /*Note for developer, {orderItemList} refers to a list of all items in order.
      * Each item should be preceded by a or an or a number based on what the item is,
      * ie a Tall Mocha, an Orange Scone, 3 pumpkin scones. */
      ItemsLocPrice: {
        ask: "Just to confirm, your order is {anOrderItemList} from our store at {orderLocation}.\n        Your total with tax is {orderPrice} and will be charged to your primary 1-800-Flowers Card.\n        May I place this order for you?",
        reprompt: "Your order is {anOrderItemList} from our store at {orderLocation}. Your total with tax is {orderPrice} and will be charged to your primary 1-800-Flowers Card. May I place this order for you? "
      },

      AskOrderRevert: {
        ask: "Would you like me to start over so that you can review your most recent order or change your store?",
        reprompt: "Would you like me to start over so that you can review your most recent order or change your store?"
      }
    },

    PaymentIssues: {
      /*Note for developer, {cardBalance} is SVC balance; {reloadAmount} is lowest standard reload amount that
      * covers difference in what is owed.*/
      NeedsToReload: {
        ask: "I'm sorry, but the current balance on your 1-800-Flowers Card is {currentBalance}. If you’d like me to place this order,\n        we'll need to reload your card first.\n        <break time=\"1s\"/>\n        The closest reload amount to your balance is {reloadAmount}.\n        Would you like me to reload your card with {reloadAmount} and finalize your order?",
        reprompt: "The balance of your 1-800-Flowers Card is {currentBalance}. If you’d like me to place this order, we'll need to reload your card first." + '<break time="1s"/>' + "The closest reload amount to your balance is {reloadAmount}. Would you like me to reload your card with {reloadAmount} and finalize your order?"
      },

      CreditCardIssue: {
        tell: "I'm sorry. I wasn't able to process your transaction because of an issue with the payment\n        method associated with your 1-800-Flowers Card.\n        <break time=\"1s\"/>\n        You can make changes to the payment method that’s associated with your 1-800-Flowers Card\n        by downloading and logging into to the 1-800-Flowers Mobile App. Once logged in,\n        simply use the Pay Tab to adjust your payment settings.\n        <break time=\"1s\"/>\n        You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store.\n        When you're ready, come back and I'll be happy to place your order.\n        <break time=\"1s\"/>\n        Thank you {userName}. And have a {goodbyeDayReference}!"
      }
    },

    OrderSuccess: {
      /* Note for developer, {goodbyeDayReference} would be either great day, good night, good evening or good morning.
       * If we cannot determine time of day at the user's location then we use good day.
       * If we can then we use good day, good evening or good night.
       * {orderLocation} is final pickup location.
       * {pickupTime} is the time range provided by ordering API for order pickup at selected location.
      */
      GeneralThanksOrderDetails: {
        tell: "Thank you! Your order has been placed and will be available at the 1-800-Flowers at {orderLocation} in {pickupTime} minutes.\n        I've sent a card to your Alexa App with your order, pick-up time, and a few additional details.\n        <break time=\"1s\"/>\n        Thanks again, {userName}. And have a {goodbyeDayReference}!",
        card: {
          type: 'Simple',
          title: '1-800-Flowers - Order Details',
          content: "Hi {userName}!\n\n" +
            "Your 1-800-Flowers order will be ready to pickup in {pickupTime} minutes at the 1-800-Flowers at {orderLocation}.\n\n" +
            "Here's the address in case you need it:\n" +
            "{orderLocationFullAddress}\n\n" +
            "Here's the items you can expect when you arrive:\n" +
            "{orderItemsListTextFormatted}\n\n" +
            "The total charged to your primary 1-800-Flowers Card was {orderPriceTextFormatted}\n\n" +
            "You have {currentBalanceTextFormatted} remaining on your 1-800-Flowers Card"
        }
      },

      /*Note for developer, {goodbyeDayReference} would be either great day, good night, good evening or good morning. If we cannot determine time of day at the user's location then we use good day. If we can then we use good day, good evening or good night.
      {orderLocation} is final pickup location.
      {pickupTime} is the time range provided by ordering API for order pickup at selected location.
      */
      FromReloadThanksOrderDetails: {
        tell: "Thank you! I've reloaded your card and placed your order of {anOrderItemList}.\n        Your order will be ready at the 1-800-Flowers at {orderLocation} in {pickupTime} minutes.\n        I've sent a card to your Alexa App with your exact order, pick-up time, and a few additional details.\n        <break time=\"1s\"/>\n        Thanks again, {userName}. And have a {goodbyeDayReference}!",
        card: {
          type: 'Simple',
          title: '1-800-Flowers - Order Details',
          content: "Hi {userName}!\n\nYour 1-800-Flowers order will be ready to pickup in {pickupTime} minutes at the 1-800-Flowers at {orderLocation}.\n\nHere's the address in case you need it:\n{orderLocationFullAddress}\n\nHere's the items you can expect when you arrive:\n{orderItemsListTextFormatted}\n\nThe total charged to your primary 1-800-Flowers Card was {orderPriceTextFormatted}\nAs a reminder, during your order you reloaded your card for {reloadAmountTextFormatted}\nYou have {currentBalanceTextFormatted} remaining on your 1-800-Flowers Card"
        }
      }
    },

    Help: {

      HelpStartMenu: {
        ask: "I'd be happy to help. "
          + "I can tell you more about ordering, "
          + "tell you the balance on your 1-800-Flowers Card, "
          + "or provide you with other options. "
          + "Which would you prefer?",
        reprompt: "I'd be happy to help.  I can tell you more about ordering, tell you the balance on your 1-800-Flowers Card, or provide you with other options. Which would you prefer?"
      },

      HelpOtherMenu: {
        ask: "OK. I can tell you how to make adjustments to your 1-800-Flowers Card\n        or associated payment method,\n        or I can tell you how to change your available locations,\n        previous orders,\n        or account settings.\n        You can also hear additional help options. Which would you prefer?",
        reprompt: "I can tell you how to make adjustments to your 1-800-Flowers Card or associated payment method, or I can tell you how to change your available locations, previous orders, or account settings. You can also hear additional help options. Which would you prefer?"
      },

      HelpMenuRestart: {
        ask: "I can tell you more about ordering, tell you the balance on your 1-800-Flowers Card, or provide you with other options. Which would you prefer?",
        reprompt: "I can tell you more about ordering, tell you the balance on your 1-800-Flowers Card, or provide you with other options. Which would you prefer?"
      },

      HelpAboutOrder: {
        ask: "This 1-800-Flowers Amazon Echo skill allows you to reorder the most recent purchase you made with "
         + "Mobile Order and Pay using the 1-800-Flowers Mobile app. "
         + '<break time="1s"/>'
         + "I can tell you the items from your most recent order and even remove individual items from "
         + "orders with multiple items. I can also change your store to any other 1-800-Flowers you've ordered "
         + "from using the 1-800-Flowers app. "
         + '<break time="1s"/>'
         + "When reordering, use the primary 1-800-Flowers card you were shown when enabling the skill. "
         + "If you don't have sufficient funds on your primary 1-800-Flowers card to fulfill an order, "
         + "I can reload your card for you, using the payment method you selected when enabling the skill. "
         + "You can access the Help Menu at any time, simply by saying the word Help. "
         + "Once there, you can learn how you can make adjustments to your 1-800-Flowers Card and associated payment method as well as learn how to change your available locations, previous orders, and account settings. "
         + '<break time="1s"/>'
         + "Would you like to hear additional ways I can help you with this skill?",
        reprompt: "Would you like to hear additional ways I can help you with this skill?"
      },

      HelpBalanceCheck: {
        ask: "The balance on your primary 1-800-Flowers Card is {currentBalance}."
        + '<break time="1s"/>'
        + "Would you like to hear additional ways I can help you with this skill?",
        reprompt: "The balance on your primary 1-800-Flowers Card is {currentBalance}. "
        + "Would you like to hear additional ways I can help you with this skill?"
      },

      HelpAdjustFlowersCard: {
        ask: "To make any adjustments to the primary 1-800-Flowers Card that is associated with your account, you will need to login to your 1-800-Flowers account by using the 1-800-Flowers mobile app or by visiting 1-800-Flowers.com " + '<break time="1s"/>' + "If you change your primary card with the app or website, those settings will automatically be applied and used when you make purchases using this Echo skill. " + '<break time="1s"/>' + "You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store. " + '<break time="1s"/>'
        + "Would you like to hear additional ways I can help you with this skill? ",
        reprompt: "Your 1-800-Flowers Card can be adjusted using the 1-800-Flowers app or at 1-800-Flowers.com. You can download the app in the App Store on iPhone or the Google Play Store. " + '<break time="1s"/>' + "Would you like to hear additional ways I can help you with this skill? "
      },

      HelpReloadCard: {
        ask: "If you want to reload your card for a specific amount, simply download and login to the 1-800-Flowers Mobile app."
        + '<break time="1s"/>'
        + "You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store."
        + '<break time="1s"/>'
        + "Would you like to hear additional ways I can help you with the skill?",
        reprompt: "If you want to reload your card for a specific amount, simply download and login to the 1-800-Flowers Mobile app. You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store." + '<break time="1s"/>' + "Would you like to hear additional ways I can help you with this skill?"
      },

      HelpAdjustPayment: {
        ask: "You'll need to use a payment method that you've previously associated with your 1-800-Flowers account. You can select this payment in the authentication settings in the Alexa app. I've just pushed a card to the Alexa app that will help you with this process. " + '<break time="1s"/>' + "Would you like me to tell you how to add a new payment method to your account?",
        reprompt: "Would you like me to tell you how to add a new payment method to your account?",
        card: authCard
      },

      HelpNewPayment: {
        ask: "To add a new payment method, simply login to your 1-800-Flowers account by using the 1-800-Flowers mobile app or by visiting 1-800-Flowers.com." + '<break time="1s"/>' + "You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store." + '<break time="1s"/>' + "Would you like to hear additional ways I can help you with this skill?",
        reprompt: "Would you like to hear additional ways I can help you with this skill?"
      },

      HelpAdjustLocation: {
        ask: "I'm sorry, but at this time, I can only help you order from a 1-800-Flowers store you've previously ordered from using the 1-800-Flowers Mobile app or another 1-800-Flowers Mobile Order and Pay platform."
        + '<break time="1s"/>'
        + "If you would like to add additional stores that you can select from using your Echo, please download and login to the 1-800-Flowers Mobile app and place an order at the 1-800-Flowers of your choice." + '<break time="1s"/>' + "You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store." + '<break time="1s"/>' + "Would you like to hear additional ways I can help you with this skill?",
        reprompt: "You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store." + '<break time="1s"/>' + "Would you like to hear additional ways I can help you with this skill?"
      },

      HelpAdjustOrder: {
        ask: "If you would rather order something other than what we've discussed, simply download and login to the 1-800-Flowers Mobile app."
        + '<break time="1s"/>'
        + "You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store. Once you've picked up your order, I can reorder it for you anytime using this Echo skill." + '<break time="1s"/>' + "Would you like to hear additional ways I can help you with this skill?",
        reprompt: "If you would rather order something other than what we've discussed, simply download and login to the 1-800-Flowers Mobile app." + '<break time="1s"/>' + "You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store. Once you've picked up your order, I can reorder it for you anytime using this Echo skill."
        + '<break time="1s"/>'
        + "Would you like to hear additional ways I can help you with this skill?"
      },

      HelpAdjustSettings: {
        ask: "If you want to change any of your personal account settings, such as your email address or name, simply download and login to the 1-800-Flowers Mobile app."
        + '<break time="1s"/>'
        + "You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store. Changes you make to your settings in the app will automatically be applied and used when you use this Echo skill." + '<break time="1s"/>' + "Would you like to hear additional ways I can help you with this skill?",
        reprompt: "You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store. Changes you make to your settings in the app will automatically be applied and used when you use this Echo skill." + '<break time="1s"/>' + "Would you like to hear additional ways I can help you with this skill?"
      }
    },

    Exit: {
      /*Note for developer, {goodbyeDayReference} would be either great day, good night, good evening or good morning. If we cannot determine time of day at the user's location then we use good day. If we can then we use good day, good evening or good night.
      */
      GeneralExit: {
        tell: "Thank you {userName}. Have a {goodbyeDayReference}!"
      },
      /*Note for developer, {goodbyeDayReference} would be either great day, good night, good evening or good morning.
       * If we cannot determine time of day at the user's location then we use good day.
       * If we can then we use good day, good evening or good night.
      */
    GeneralGenericExit: {
        tell: "Thank you for visiting 1-800-Flowers. Have a great day!"
      },

      NoFromConfirmation: {
        tell: "No problem. If you'd like to come back later, I'd be happy to help you reorder any of the items we've discussed.\n        If you would rather order something else, simply download and login to the 1-800-Flowers Mobile app.\n        <break time=\"1s\"/>\n        You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store.\n        Once you've picked up your order, I can help you reorder it again anytime.\n        <break time=\"1s\"/>\n        Thank you {userName}. Have a {goodbyeDayReference}!"
      },

      NoFromLocation: {
        tell: "Currently, I can only help you order from a store you've previously ordered from using the 1-800-Flowers Mobile app. " + '<break time="1s"/>' + "If you would like to add additional stores that you can select from using your Echo, please download and login to the 1-800-Flowers Mobile app and place an order at the 1-800-Flowers of your choice." + '<break time="1s"/>' + "You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store." + '<break time="1s"/>' + "Thank you {userName}. Have a {goodbyeDayReference}!"
      },

      NoFromNoItemOtherOrder: {
        tell: "No problem. If you would rather order something else, simply download and login to the 1-800-Flowers Mobile app." + '<break time="1s"/>' + "You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store." + '<break time="1s"/>' + "Once you've picked up your order, I'd be happy to help you reorder it again anytime." + '<break time="1s"/>' + "Thank you {userName}. Have a {goodbyeDayReference}!"
      },

      NoFromItemRedirect: {
        tell: "OK. If you would rather order something else, all you need to do is download and login to the 1-800-Flowers Mobile app." + '<break time="1s"/>' + "You can download the 1-800-Flowers app in the App Store on iPhone or the Google Play Store." + '<break time="1s"/>' + "Once you've picked up your order you can reorder it again anytime using this Echo skill." + '<break time="1s"/>' + "Thank you {userName}. Have a {goodbyeDayReference}!"
      }
    }
  };
}();
module.exports = responses;
