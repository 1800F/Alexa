module.exports = {
  "session": {
    "sessionId": "SessionId.c31fe82c-4c96-4759-a6ed-3445da4f09cf",
    "application": {
      "applicationId": "amzn1.echo-sdk-ams.app.bb6f7987-6502-4127-a407-a103a98f9edc"
    },
    "attributes": {
      "reprompt": "Did you want an arrangement for someone's birthday, <break time=\"350ms\"/>Mothers Day,<break time=\"350ms\"/> \"Love and Romance\", <break time=\"350ms\"/>or, to say<break time=\"10ms\"/>Thank you?",
      "partialOrder": {
        "contactBook": {},
        "recipient": {
          "id": "602145935113074683",
          "demoId": "735145935228809939",
          "firstName": "Mark",
          "lastName": "Last",
          "address": "1234 Main St|#11||American Fork|UT|84003|US"
        }
      },
      "state": "query-arrangement-type",
      "startTimestamp": 1459826855440
    },
    "user": {
      "userId": "amzn1.ask.account.AFP3ZWPOS2BGJR7OWJZ3DHPKMOMNWY4AY66FUR7ILBWANIHQN73QG7YE363WCBUVZEDBJGOEHVIKKLM7NACMRFAFE64IJOPJ2NCCI2USE64QU7XRTP35XSSIHKW67TD73VM47TQJFO2GIUZZ5PFQLSWDBLVZ6KBC4XSEUB5VMANCQYYJIGCCK7IDAUBOC4KV7UQP6GTXJVYSSNY",
      "accessToken": "BEmfpHHVy4mZe989xLr%2BtbVRJvPb9%2BDVZ6RlY6SoRz8t%2BKicyjVjPB1Nhz4a9tIY7MbO%2B9fLglxNQxLgmE0SGAEeLTruNwiMlA12xCyLlxjr%2FDrN5Q%3D%3D"
    },
    "new": false
  },
  "request": {
    "type": "IntentRequest",
    "requestId": "EdwRequestId.3d9ae6ef-edef-4a14-89cf-3e55c5622341",
    "timestamp": "2016-04-05T03:27:51Z",
    "intent": {
      "name": "ArrangementSelectionIntent",
      "slots": {
        "bouquet": {
          "name": "bouquet"
        },
        "arrangementSlot": {
          "name": "arrangementSlot",
          "value": "thank you"
        }
      }
    }
  },
  "version": "1.0"
}
