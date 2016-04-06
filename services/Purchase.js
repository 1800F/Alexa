var Promise = require('bluebird')
  , _ = require('lodash')
  , issue = require('./api-helpers.js').issue
  , oauthReq = require('./api-helpers.js').oauthReq
  , moment = require('moment')
  , post = Promise.promisify(require('request').post)
;

var Purchase = module.exports= function Purchase(options,tokens) {
  tokens = tokens || {};
  options.transform = options.transform || _.identity;
  var qAuthReq = null;

  return options.transform({
    getShipping: getLogicalOrderShippingCharge,
    getOrderNumber: getNextOrderNumber,
    getTaxes: getTaxes,
    tokenizeCC: tokenizeCC,
    authorizeCC: authorizeCC,
    createOrder: createOrderObject,
  }, 'purchase');

  function getLogicalOrderShippingCharge(product, recipient, deliveryDate) {
    /* The product object must have:
          productSku, prodType (from getProductDetails), itemPrice

        The recipient object must have:
          firstName, lastName, addr1, addr2, city, state, postalCode, country

        The delivery object must have:
          shortDate(string formatted as: "18-FEB-15")

    */
    var body = {
       "getLogicalOrderAndShippingChargeRequest": {
          "orderLines": {
             "orderLine": [
                {
                   "lineNumber": "1",
                   "productSku": product.productSku,
                   "qty": "1",
                   "shipAlone": "N",
                   "prodType": product.prodType,
                   "parentLine": "1",
                   "logicalOrder": "0",
                   "addr1": recipient.addr1,
                   "addr2": recipient.addr2,
                   "city": recipient.city,
                   "state": recipient.state,
                   "postalCode": recipient.postalCode,
                   "country": normalizeCountryCodes(recipient.country),
                   "locationType": "1",
                   "deliveryDate": moment(deliveryDate).format('DD-MMM-YY').toUpperCase(),
                   "deliveryWindow": "1",
                   "shippingCharge": "0",
                   "itemPrice": product.itemPrice,
                   "brandCode": "1001",
                   "fsiFlag": "N",
                   "tryMe": "N",
                   "shipNow": "N",
                   "flexOptionCode": "1",
                }
             ]
          }
       }
    };

    return purchaseRequest('POST', '/getLogicalOrderShippingCharge', {}, body, "product").then(function(shipping){
      if (shipping.getLogicalOrderAndShippingChargeResponse.responseStatus == "SUCCESS") {
        return shipping.getLogicalOrderAndShippingChargeResponse.orderItemsGroupingResult.orderLinesResult.orderLineResult;
      }
      else
        return {error:shipping.getLogicalOrderAndShippingChargeResponse.orderItemsGroupingResult.flwsErrors.flwsError.errorMessage};
    });
  }

  function getNextOrderNumber() {
    var body = {
       "esbSaltaServiceRequest": {
          "getOrderNumberRequest": {
             "brandCode": "1001",
             "sourceId": "W0091"
          }
       }
    };

    return purchaseRequest('POST', '/getNextOrderNumber', {}, body,  "product").then(function(orderNum){
      if (orderNum.esbSaltaServiceResponse.getOrdderNumberResponse.getOrdderNumberResult.flwsErrors.flwsError.errorMessage) {
        return {error:orderNum.esbSaltaServiceResponse.getOrdderNumberResponse.getOrdderNumberResult.flwsErrors.flwsError.errorMessage};
      }
      else return orderNum.esbSaltaServiceResponse.getOrdderNumberResponse.getOrdderNumberResult.OrderNumber;
    });
  }

  function getTaxes(sku, zip, itemPrice, shipping) {
    var body = {
       "getRecipientTaxRequest": {
          "recipients": {
             "recipient": [
                {
                   "lineNumber": "1",
                   "productSku": sku,
                   "qty": "1",
                   "prodType": "FPT",
                   "zipCode": zip,
                   "country": "USA",
                   "itemPrice": itemPrice,
                   "shippingCharge": shipping,
                   "brandCode": "1001"
                }
             ]
          }
       }
    };

    return purchaseRequest('POST', '/getTaxes', {}, body, "product").then(function(taxes){
      var recResult = taxes.getRecipientTaxResponse.getRecipientTaxResult.recipientsResult.recipientResult[0];
      if (recResult.errorCode != "0") {
        return {error:recResult.errorDescription};
      }
      else return +recResult.taxAmount;
    });
  }

  function tokenizeCC(CC, token) {
    var body = {
     "protectTokenRequest": {
        "tokenDetail": {
           "sourceid": "W0097",
           "token": CC
        },
        "authorizationData": {
           "userName": options.paymentUser,
           "password": options.paymentPass
        }
     }
    };

    return purchaseRequest('POST', '/tokenizeCC', {}, body, "payment").then(function(token){
      console.log("Tokenization Result: " + JSON.stringify(token));
      if (token.errorCode != "0") {
        return {error:token.errorDescription};
      }
      else return token;
    });
  }

  function authorizeCC(paymentInfo, amount, user) {
    var body = {
      "paymentRequest": {
          "authorization": {
             "security": {
                "username": options.paymentUser, //This will be updated in production
                "password": options.paymentPass  //This will be updated in production
             },
             "sourceId": "W0097",
             "orderId": "8401226524",
             "creditCards": {
                "creditCard": {
                   "creditCardPaymentInfo": {
                      "cardNumber": paymentInfo.number,
                      "cardType": paymentInfo.type.value,
                      "securityCode": "", //We don't collect this, but it's not required
                      "nameOnCard": paymentInfo.nameOnCard,
                      "cardExpDate": paymentInfo.cardExpiryDate,
                      "currencyCode": "840",
                      "transactionAmount": amount.toFixed(2),
                      "divisionNumber": "104272",
                      "transactionType": "7"
                   },
                   "billToAddressProfile": {
                      "profile": {
                         "name": user.displayName,
                         "address": {
                            "addressLine1": user.address.addr1,
                            "addressLine2": user.address.addr2,
                            "city": user.address.city,
                            "stateCode": user.address.state,
                            "countryCode": user.address.country,
                            "zipCode": user.address.postalCode
                         },
                         "phone": {
                            "telephoneType": "d",
                            "telephoneNumber": user.phone
                         },
                         "email": {
                            "emailPrimary": user.email
                         }
                      }
                   }
                }
             }
          }
       }
    };

    return purchaseRequest('POST', '/authorizeCC', {}, body,  "payment").then(function(authorization){
      var authResult = authorization;
      console.log("CC Auth Result: " + JSON.stringify(authResult));
      if (authResult.errorCode != "0") {
        return {error:authResult.errorDescription};
      }
      else return authResult.paymentResponse.authorizations.creditCardAuthorizations;
    });
  }

  function createOrderObject(product, user, recipient, payment, delivery) {
    return getNextOrderNumber().then(function (orderNumber) {
      var testOrder = {
          // '@': {
          //   "xmlns:ord": "http://1800flowers.com/BTOP/OrderFile"
          // },
          "ord:orders": [{
            "ord:orderHeader": {
              "ord:primaryBrand": "1001",
              "ord:orderNumber": orderNumber,
              "ord:externalOrderNumber": "",
              "ord:externalTransId": "",
              "ord:machineId": "192177225",
              "ord:orderDate": dateTimeString(),
              "ord:thirdPartyToken": {
                "ord:tokenId": "",
                "ord:tokenType": "",
                "ord:tokenDetails1": "",
                "ord:tokenDetails2": "",
              },
              "ord:soldTo": {
                "ord:cifId": user.systemID,
                "ord:houseAccountNumber": "",
                "ord:title": "",
                "ord:firstName": user.firstName,
                "ord:lastName": user.lastName,
                "ord:address": {
                  "ord:streetAddress1": user.address.addr1,
                  "ord:streetAddress2": user.address.addr2,
                  "ord:streetAddress3": "",
                  "ord:attentionText": "",
                  "ord:cityName": user.address.city,
                  "ord:state": user.address.state,
                  "ord:zipCode": user.address.postalCode,
                  "ord:countryCode": user.address.country,
                  "ord:addressType": "0",
                },
                "ord:phones": {
                  "ord:type": "HP",
                  "ord:telephoneNumber": user.phone,
                },
                "ord:emailAddress": "",
                "ord:optInFlag": "",
                "ord:gender": "",
                "ord:specialFlag": "",
                "ord:businessName": "",
                "ord:middleName": "",
                "ord:suffix": "",
                "ord:CustomerSuffix": "",
              },
              "ord:orderTotalAmount": {
                "ord:totalAmount": product.amount,
                "ord:taxAmount": product.tax,
                "ord:discountAmount": "0.0",
                "ord:serviceCharge": "",
                "ord:giftCertificateAmount": "0.0",
                "ord:shippingChargeAmount": product.shipping,
              },
              "ord:serverId": "",
              "ord:sourceId": "W0097",
              "ord:sourceCode": "",
              "ord:sourceTypeCode": "",
              "ord:companyCode": "063",
              "ord:merchantId": "126367",
              "ord:partnerId": "",
              "ord:linkshareDetails": {
                "ord:linkshareId": "",
                "ord:orderStartTime": "",
                "ord:orderCompleteTime": "",
              },
              "ord:agentInfo": {
                "ord:employeeCode": "",
                "ord:sourceCode": "",
                "ord:telecenterCode": "",
              },
              "ord:transactionReleaseCode": "",
              "ord:findersFileNumber": "",
              "ord:DNIS": "",
              "ord:caller": "test",
              "ord:ANI": "",
              "ord:IPAddress": "127.0.0.1", //1800 FLOWERS WILL VERIFY THAT IT IS OK TO OMIT
              "ord:ReleaseDescription": "",
              "ord:channelId": "",
              "ord:orderNotes": "",
              "ord:orderCaptureClientId": "",
              "ord:bannerCode": "",
              "ord:referralCode": "",
              "ord:cmTrackInfo1": "",
              "ord:cmTrackInfo2": "",
              "ord:agentId": "",
              "ord:startTime": "",
              "ord:endTime": "",
              "ord:finderNumber": "",
              "ord:customerInterface": "ALEXA",
              "ord:refererUrl": "",
              "ord:landingUrl": "",
              "ord:userAgent": "ALEXA",
              "ord:shopperSatus": "G",
              "ord:passportUsed": "",
              "ord:passportStatus": "",
              "ord:signedApp": "",
              "ord:giftListUsed": "N",
              "ord:promoStatus": "",
              "ord:checkoutBrand": "FLOWERS",
            },
            "ord:orderDetails": {
              "ord:brandCode":"1001",
              "ord:recipient": {
                "ord:recipientNumber": "1",
                "ord:title": "",
                "ord:firstName": recipient.firstName,
                "ord:lastName": recipient.lastName,
                "ord:emailAddress": recipient.email,
                "ord:address": {
                  "ord:streetAddress1": recipient.addr1,
                  "ord:streetAddress2": recipient.addr2,
                  "ord:streetAddress3": "",
                  "ord:attentionText": "",
                  "ord:cityName": recipient.city,
                  "ord:state": recipient.state,
                  "ord:zipCode": recipient.postalCode,
                  "ord:countryCode": recipient.country,
                  "ord:addressType": "1",
                },
                "ord:addressVerify": "",
                "ord:recordTypeIndicator": "",
                "ord:addressTypeIndicator": "",
                "ord:dpvConfirmIndicator": "",
                "ord:deliveryDate": "",
                "ord:phones": {
                  "ord:type": "HP",
                  "ord:telephoneNumber": recipient.phone,
                },
                "ord:specialInstructions": "",
                "ord:products": {
                  "ord:externalOrderLineId": "",
                  "ord:externalItemId": "",
                  "ord:shipAlone": "N",
                  "ord:lineNumber": "1",
                  "ord:parentLineNumber": "1",
                  "ord:fsiFlag": "N",
                  "ord:tryMe": "N",
                  "ord:productCode": product.sku,
                  "ord:quantity": "1",
                  "ord:vaseId": "",
                  "ord:productName": product.name,
                  "ord:productType": "FPT",
                  "ord:brandCode": "1001",
                  "ord:soldOnBrandCode": "",
                  "ord:productInstructions": "",
                  "ord:productPrice": product.price,
                  "ord:secondChoiceProductCode": "",
                  "ord:monogramFlag": "",
                  "ord:monogramId": "",
                  "ord:monogramType": "",
                  "ord:monogramText": "",
                  "ord:continuityIndicator": "",
                  "ord:crossBrandOrderInfo": "",
                  "ord:personalizationInformation": "",
                  "ord:shippingMethod": "",
                  "ord:cardMessage": "",
                  "ord:ocassionCode": "8",
                  "ord:holidayCode": "",
                  "ord:itemDiscountAmount": "0.00",
                  "ord:itemDiscountAmountPercent": "0.00",
                  "ord:itemTaxAmount": product.tax,
                  "ord:itemServiceChargeAmount": "0.00",
                  "ord:itemShippingChargeAmount": product.shipping,
                  "ord:methodDescription": "",
                  "ord:deliveryDate": product.deliveryDate,
                  "ord:outsideDate": "",
                  "ord:flexGuaranteedFlag": "N",
                  "ord:customerDOB": "",
                  "ord:shipNow": "N",
                  "ord:primeShippingApplied": "",
                  "ord:thirdPartyTokens": {
                    "ord:thirdPartyToken": {
                      "ord:tokenId": "",
                      "ord:tokenType": "",
                      "ord:tokenDetails1": "",
                      "ord:tokenDetails2": "",
                    },
                  },
                  "ord:lineItemType": "",
                },
                "ord:recipientTotalAmount": {
                  "ord:totalAmount": product.total,
                  "ord:taxAmount": product.tax,
                  "ord:discountAmount": "0.0",
                  "ord:serviceCharge": "0.0",
                  "ord:giftCertificateAmount": "0.0",
                  "ord:shippingChargeAmount": product.shipping,
                },
                "ord:gender": "",
                "ord:fssId": "",
                "ord:businessName": "",
                "ord:businessExtension": "",
                "ord:suffix": "",
                "ord:recipientSuffix": "",
              },
              "ord:brandTotalAmount": {
                "ord:totalAmount": product.total,
                "ord:taxAmount": product.tax,
                "ord:discountAmount": "0.0",
                "ord:serviceCharge": "0.0",
                "ord:giftCertificateAmount": "0.0",
                "ord:shippingChargeAmount": product.shipping,
              },
              "ord:paymentDetails": {
                "ord:creditCardPayment": {
                  "ord:creditCardNumber": payment.number,
                  "ord:nameOnCard": payment.name,
                  "ord:billToInfo": {
                    "ord:cifId": user.systemID,
                    "ord:title": "",
                    "ord:firstName": user.firstName,
                    "ord:lastName": user.lastName,
                    "ord:address": {
                      "ord:streetAddress1": user.address.addr1,
                      "ord:streetAddress2": user.address.addr2,
                      "ord:streetAddress3": "",
                      "ord:attentionText": "",
                      "ord:cityName": user.address.city,
                      "ord:state": user.address.state,
                      "ord:zipCode": user.address.postalCode,
                      "ord:countryCode": user.address.country,
                      "ord:addressType": "0",
                    },
                    "ord:phones": {
                      "ord:type": "HP",
                      "ord:telephoneNumber": user.phone,
                    },
                    "ord:emailAddress": user.email,
                    "ord:optInFlag": "",
                    "ord:gender": "",
                    "ord:specialFlag": "",
                    "ord:businessName": "",
                    "ord:middleName": "",
                    "ord:suffix": "",
                    "ord:CustomerSuffix": "",
                  },
                  "ord:expirationDate": payment.expiration,
                  "ord:cardType": payment.cardType,
                  "ord:cryptogram": "",
                  "ord:thirdPartyPaymentType": "",
                  "ord:thirdPartyTransactionId": "",
                  "ord:approvalCode": payment.approvalCode,
                  "ord:secureIdentifier": "",
                  "ord:CAVVValue": "",
                  "ord:AVSResponseCode": payment.AVSResponseCode,
                  "ord:currencyValue": "",
                  "ord:IPAddress": "127.0.0.1",
                  "ord:transactionXid": "",
                  "ord:cardSecurityValue": "",
                  "ord:CAVVResponseCode": "",
                  "ord:cardSecurityValueResponse": "",
                  "ord:authType": payment.authType,
                  "ord:authorizedAmount": payment.authorizedAmount,
                  "ord:googleTransactionId": "",
                },
                "ord:houseAccountPayment": {
                  "ord:accountNumber": "",
                  "ord:referenceCode": "",
                  "ord:costCenterCode": "",
                  "ord:poNumber": "",
                  "ord:paymentAmount": "",
                },
                "ord:BMLPayment": {
                  "ord:bmlAccountNumber": "",
                  "ord:dateOfBirth": "",
                  "ord:socialSecurityNumber": "",
                  "ord:termsAndConditionVersion": "",
                  "ord:itemCategory": "",
                  "ord:additionalInfo": "",
                  "ord:registrationDate": "",
                  "ord:productDeliveryType": "",
                  "ord:authorizedAmount": "",
                  "ord:authType": "",
                },
                "ord:funbuckPayment": {
                  "ord:employeeId": "",
                  "ord:noOfFunbucks": "",
                },
                "ord:payPalPayment": {
                  "ord:transactionId": "",
                  "ord:settlementDate": "",
                  "ord:settlementAmount": "",
                },
                "ord:vme": {
                  "ord:callid": "",
                  "ord:adminId": "",
                  "ord:transactionId": "",
                  "ord:settlementDate": "",
                  "ord:settlementAmount": "",
                },
                "ord:giftCardPayments": "",
              },
              "ord:promotions": "",
              "ord:basketThirdPartyInfo": {
                "ord:third_party_name": "",
                "ord:third_party_clubId": "",
                "ord:third_party_memberId": "",
              },
            },
            "ord:errorFlag": ""
          }]
      };
      return testOrder;
    });
  }

  function purchaseRequest(method, path, queryString, body, apiType) {
    return getAuthToken().then(function (token) {
      return issue(method, token, path, queryString, body, options, apiType).then(function (res) {
        if (res.statusCode == 401) {
          //Our token expired
          if (!tokens.access_token) tokens.refresh_token = null; //Must have already tried a refresh, so this next time, go anew
          tokens.access_token = null;
          return apprequest.apply(self, args);
        }
        if (res.statusCode >= 400) return Promise.reject(res.body);
        return res.body;
      });
    });
  }

  function getAuthToken() {
    if (tokens.access_token) return Promise.resolve(tokens.access_token);
    if(qAuthReq) return qAuthReq;
    return qAuthReq = oauthReq('password', options.defaultCredentials, options,'payment').then(function (toks) {
      qAuthReq = null;
      if(toks.error) return Promise.reject(toks.error);
      tokens = toks;
      return toks.access_token;
    }).catch(function(e){
      qAuthReq = null;
      return Promise.reject(e);
    });
  }
}


function normalizeCountryCodes(code) {
  if(!code) return code;
  // The address API gives back US, but the shipping API requires USA
  if(code.toLowerCase() == 'us') return 'USA';
  return code;
}

function dateTimeString(date) {
  if (typeof date === 'undefined') {
    date = new Date();
  }
  else {
    date = new Date(date);
  }

  var day = date.getDate();
  var month = date.getMonth()+1; //January is 0!
  var year = date.getFullYear();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();

  if(day<10) {
      day='0'+day
  }
  if(month<10) {
      month='0'+month
  }
  if(hours<10) {
      hours='0'+hours
  }
  if(minutes<10) {
      minutes='0'+minutes
  }
  if(seconds<10) {
      seconds='0'+seconds
  }
  return month + "/" + day + "/" + year + " " + hours + ":" +  minutes + ":" + seconds;
}
