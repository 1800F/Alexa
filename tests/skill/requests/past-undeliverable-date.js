var moment = require('moment');
module.exports = {
  "session": {
    "sessionId": "SessionId.226a710f-e94f-4668-b874-3de5414af8ea",
    "application": {
      "applicationId": "amzn1.echo-sdk-ams.app.bb6f7987-6502-4127-a407-a103a98f9edc"
    },
    "attributes": {
      "reprompt": "To select a date just say 'tomorrow' or 'next Wednesday' or the month and day, like 'March 6th'.",
      "partialOrder": {
        "contactBook": {
          "contacts": [
            {
              "name": "Mark",
              "contacts": [
                {
                  "id": "602145935113074683",
                  "firstName": "Mark",
                  "lastName": "Last",
                  "address": "1234 Main St|#11||American Fork|UT|84003|US"
                },
                {
                  "id": "602145935113074683",
                  "firstName": "Mark",
                  "lastName": "Test",
                  "address": "24 S Center Street|||Spanish Fork|UT|84660|US"
                },
                {
                  "id": "602145935113074683",
                  "firstName": "Mark",
                  "lastName": "Marcos",
                  "address": "7201 S State Street|||Murray|UT|84015|US"
                },
                {
                  "id": "602145935113074683",
                  "firstName": "Mark",
                  "lastName": "Miles",
                  "address": "1222 E 4530 S|||Salt Lake City|UT|84199|US"
                },
                {
                  "id": "602145935113074683",
                  "firstName": "Mark",
                  "lastName": "Provo",
                  "address": "121 E Center Street|||Provo|UT|84001|US"
                },
                {
                  "id": "602145935113074683",
                  "firstName": "Mark",
                  "lastName": "Stevenett",
                  "address": "686 E 110 S|Suite 102||AMERICAN FORK|UT|84003|US"
                },
                {
                  "id": "602145935113074683",
                  "firstName": "Mark",
                  "lastName": "Spanish",
                  "address": "68 N 300 W|||Spanish Fork|UT|84660|US"
                },
                {
                  "id": "602145935113074683",
                  "firstName": "Mark",
                  "lastName": "Hello",
                  "address": "2401 S Canyon Rd|||Spanish Fork|UT|84660|US"
                },
                {
                  "id": "602145935113074683",
                  "firstName": "Mark",
                  "lastName": "Ogden",
                  "address": "832 Holroyd Dr|||South Ogden|UT|84403|US"
                },
                {
                  "id": "602145935113074683",
                  "firstName": "Mark",
                  "lastName": "Vegas",
                  "address": "1277 Joshua Tree Ct|||Las Vegas|NV|89084|US"
                },
                {
                  "id": "602145935113074683",
                  "firstName": "Mark",
                  "lastName": "George",
                  "address": "2409 Skyline Dr|||St. George|UT|84901|US"
                },
                {
                  "id": "602145935113074683",
                  "firstName": "Mark",
                  "lastName": "Mesquite",
                  "address": "101 S Smith Ln|||Mesquite|NV|89027|US"
                }
              ]
            }
          ]
        },
        "recipient": {
          "id": "602145935113074683",
          "firstName": "Mark",
          "lastName": "Last",
          "address": "1234 Main St|#11||American Fork|UT|84003|US"
        },
        "arrangement": {
          "name": "Thank You",
          "sku": "100299",
          "details": {
            "prodType": "FPT",
            "items": [
              {
                "sku": "100299L",
                "price": "69.99"
              },
              {
                "sku": "100299M",
                "price": "59.99"
              },
              {
                "sku": "100299S",
                "price": "49.99"
              }
            ]
          }
        },
        "size": "small"
      },
      "state": "query-date",
      "startTimestamp": 1459460371283
    },
    "user": {
      "userId": "amzn1.ask.account.AFP3ZWPOS2BGJR7OWJZ3DHPKMOMNWY4AY66FUR7ILBWANIHQN73QG7YE363WCBUVZEDBJGOEHVIKKLM7NACMRFAFE64IJOPJ2NCCI2USE64QU7XRTP35XSSIHKW67TD73VM47TQJFO2GIUZZ5PFQLSWDBLVZ6KBC4XSEUB5VMANCQYYJIGCCK7IDAUBOC4KV7UQP6GTXJVYSSNY",
      "accessToken": "BEmfpHHVy4mZe989xLr%2BtbVRJvPb9%2BDVZ6RlY6SoRz8t%2BKicyjVjPB1Nhz4a9tIY7MbO%2B9fLglxNQxLgmE0SGAEeLTruNwiMlA12xCyLlxjr%2FDrN5Q%3D%3D"
    },
    "new": false
  },
  "request": {
    "type": "IntentRequest",
    "requestId": "EdwRequestId.6aa7af42-b0d3-4da6-84d4-574d96e456c7",
    "timestamp": "2016-03-31T21:41:45Z",
    "intent": {
      "name": "DateSelectionIntent",
      "slots": {
        "deliveryDateSlot": {
          "name": "deliveryDateSlot",
          "value": '2000-03-04'
        }
      }
    }
  },
  "version": "1.0"
}
