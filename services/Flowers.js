'use strict';

var Promise = require('bluebird'),
    post = Promise.promisify(require('request').post),
    get = Promise.promisify(require('request').get),
    parseString = require('xml2js').parseString,
    js2xmlparser = require("js2xmlparser"),
    path = require('path'),
    config = require('../config/'),
    md5 = require('md5'),
    _ = require('lodash'),
    wsdl = path.resolve('./www/public/submitOrder/BTOPOrderFileService.wsdl'),
    countryCode = 'US',
    localeCode = 'en-us'
    ;

var Flowers = module.exports = function Flowers(options, tokens) {
  //options = _.assign({ version: 'alexa/uat/account/v1' }, options);
  options.transform = options.transform || _.identity;
  tokens = tokens || {};
  var qAuthReq = null;

  return options.transform({
    forgotUsername: forgotUsername,
    resetPassword: resetPassword,
    login: login,
    createCustomer: createCustomer,
    addCustomerDetails:addCustomerDetails,
    auth: getAuthToken,
    dynamoLogin:dynamoLogin,
    User: function User(tokens) {
      return FlowersUser(options, tokens);
    }
  }, 'app');

  function login(username, password) {
    //Do oauthRequest with defaultCredentials
    return oauthReq('password', { username: '1stevenh@rain.agency', password: '1rainPssword' }, options).then(function (tokens) {
      //If successful, store username and password entered in into options to use for authenticate
      if (tokens.error) return Promise.reject(tokens.error);
      options.username = username;
      options.password = password;
      console.log("LOGIN OPTIONS: ");
      console.log(options);
      return FlowersUser(options, tokens);
    });
  }

  function createCustomer(id, password) {
    var body = {
      "registerCustomer": {
        "customerDetail": {
          "customerID": id,
          "password": password,
          "sourceSystem": "FDWEB"
        }
      }
    };
    return apprequest('POST', '/registerNewCustomer', {} , body, null, "customer");
  }

  function addCustomerDetails(first, last, email, customerID) {
    var body = {
      "AddPerson":{
        "control":{
          "requestId":"1400",
          "requesterName":"GFGB",
          "requesterLanguage":"-1",
          "requesterLocale":"en"
        },
        "person":{
          "displayName": first + " " + last,
          "preferredLanguage":{"@code":"-1"},
          "identification":{
            "number": email,
            "type":{"@code":"A"},
            "idStatus":{"@code":"1"}
          },
          "privPref":{
            "value":"Y",
            "type":{"@code":"666"},
            "privPrefReason":{"@code":"1"},
            "sourceIdentifier":{"@code":"400"}
          },
          "adminContEquiv":{
            "adminSysPartyId": customerID,
            "adminSystemType":{"@code":"J"}
          },
          "birthDate":"1900-01-01",
          "name":{
            "startDate":"2016-03-13T16:24:20.585Z",
            "nameUsage":{
              "@code":"G",
              "#text":"Preferred"
            },
            "prefix":{"@code":"14"},
            "prefixDescription":[],
            "givenNameOne": first,
            "lastName": last
          },
          "XEmployerName":[]
        }
      }
    };

    return apprequest('POST', '/addPerson', {} , body, null, "customer");
  }

  function dynamoLogin(alexaUserID) {
    //Get email and password from DynamoDB
    aws.config.update({accessKeyId: options.dynamoID, secretAccessKey: options.dynamoSecret});
    //Login using those credentials and authenticate?
  }

  function forgotUsername(email) {
    return apprequest('POST', '/login/forgot-username', {}, { emailAddress: email }, null, "account");
  }

  function resetPassword(username, email) {
    return apprequest('POST', '/login/forgot-password', {}, { userName: username, emailAddress: email }, null, "account");
  }

  function apprequest(method, path, queryString, body, paging, apiType) {
    var args = arguments,
        self = this;
    return getAuthToken()
    .then(function (token) {
      return issue(method, token, path, queryString, body, paging, options, apiType);
    }).then(function (res) {
      if (res.statusCode == 401) {
        //Our token expired
        if (!tokens.access_token) tokens.refresh_token = null; //Must have already tried a refresh, so this next time, go anew
        tokens.access_token = null;
        return apprequest.apply(self, args);
      }
      if (res.statusCode >= 400) return Promise.reject(res.body);
      if (paging) res.body = wrapPagingResult(res.body, apprequest, [method, path, queryString, body]);
      return res.body;
    });
  }

  function getAuthToken() {
    if (tokens.access_token) return Promise.resolve(tokens.access_token);
    if(qAuthReq) return qAuthReq;
    return qAuthReq = oauthReq('client_credentials', {}, options).then(function (toks) {
      tokens = toks;
      qAuthReq = null;
      return toks.access_token;
    }).catch(function(e){
      qAuthReq = null;
      return Promise.reject(e);
    });
  };
};

var FlowersUser = module.exports.FlowersUser = function FlowersUser(options, tokens) {
  //options = _.assign({ version: 'alexa/uat/account/v1' }, options);
  options.transform = options.transform || _.identity;
  if (_.isString(tokens)) tokens = { access_token: tokens };

  return options.transform({
    get tokens() {
      return tokens;
    },
    authenticate: authenticate,
    refresh: refresh,
    getPaymentMethods: getPaymentMethods,
    getRecipients: getRecipients,
    getRecipientAddress: getRecipientAddress,
    getProfile: getProfile,
    submitOrder: submitOrder
  }, 'user');

  function authenticate() {
    var body = {
      "authenticateCustomer": {
        "customerDetail": {
          "customerID": options.username,
          "password": options.password,
          "saltId": "",
          "sourceSystem": "FDWEB"
        }
      }
    };
    return userrequest('POST', '/authenticateUser', {}, body, null, "account");
  }

  function refresh() {
    return oauthReq('refresh_token', { refresh_token: tokens.refresh_token }, options).then(function (toks) {
      tokens = toks;
      return toks;
    });
  }

  function getPaymentMethods(systemID) {
    var body = {
      "GetSavedCardsForCustomer":{
        "control":{
          "requestId":"1400",
          "requesterName":"GFGB",
          "requesterLanguage":"-1",
          "requesterLocale":"en"
        },
        "SourceId":"W0091",
        "AdminSystemType":"3001666",
        "AdminPartyId":systemID,
        "InquiryLevel":"4"
      }
    };
    return userrequest('POST', '/getSavedCC', {}, body, null, "account");
  }

  function getRecipients(customerID) {
    var body = {
      "getMDMRecipients":{
        "contid":customerID
      }
    };
    return userrequest('POST', '/getRecipients', {}, body, null, "account").then(function (body) {
      return body.MDMRecipientsResponse.MDMRecipients.MDMRecipient
    });
  }

  function getRecipientAddress(demographicsID, customerID) {
    var body = {
      "getMDMRecipientAddresses":{
        "demographicsID":demographicsID,
        "contid":customerID
      }
    };
    return userrequest('POST', '/getRecipientAddress', {}, body, null, "account");
  }

  function getProfile(systemID) {
    var body = {
      "Get18FCustomerByAdminSysKey":{
        "control":{
          "requestId":"1400",
          "requesterName":"GFGB",
          "requesterLanguage":"-1",
          "requesterLocale":"en"
        },
        "AdminSystemType":"3001666",
        "AdminPartyId":systemID,
        "InquiryLevel":"2"
      }
    };
    return userrequest('POST', '/getCustomerDetails', {}, body, null, "account");
  }

  function submitOrder(product, recipient, user, payment, delivery) {
    var purchase = Flowers.Purchase(config.flowers);
    return purchase.createOrder(product, recipient, user, payment, delivery).then( function(testOrder) {
      return getUserAuthToken().then(function (token) {
        return soapRequest(token, 'https://ecommerce.800-flowers.net/alexa/uat/submitOrder/v1', testOrder, options);
      });
    });

    
  }

  function userrequest(method, path, queryString, body, paging, apiType) {
    if (queryString && queryString.giveResponse) {
      var giveResponse = true;
      delete queryString.giveResponse;
    }
    return getUserAuthToken()
    .then(function (token) {
      return issue(method, token, path, queryString, body, paging, options, apiType);
    }).then(function (res) {
      console.log("----------------------------RESPONSE STATUS------------------------------");
      console.log(res.statusCode);
      if (res.statusCode < 200 || res.statusCode >= 300) return Promise.reject(res);
      if (res.statusCode == 201 && !res.body) res.body = {};
      if (paging) res.body = wrapPagingResult(res.body, userrequest, [method, path, queryString, body]);
      if (giveResponse) res.body.response = res;
      return res.body;
    });
  }

  function getUserAuthToken() {
    // TODO: Check expiration of the access_token and refresh. Right now we wait for fail before refresh
    return Promise.resolve(tokens.access_token);
  }

};

var Product = module.exports.Product = function Product(options, productSKU) {
  //options = _.assign({ version: 'alexa/uat/account/v1' }, options);
  options.transform = options.transform || _.identity;

  return options.transform({
    SKU: productSKU,
    details: {},
    getProductDetails: getProductDetails,
    earliestDelivery: getEarliestDeliveryDate,
    getDeliveryCalendar: getDeliveryCalendar,
  }, 'product');

  function getProductDetails() {
    var body = {
     "getProductDetailsRequest": {
        "customerId": "123",
        "customerType": "P",
        "storeId": "20054",
        "siteId": "18F",
        "sourceSystem": "web",
        "brandCode": "1001",
        "productSku": this.SKU,
        "productBase": this.SKU
     }
    };
    return productrequest('POST', '/getProductDetail', {}, body, null, "product").then(function(details){
      return details.getProductDetailResponse.getProductDetailResult;
    });
  }

  function getEarliestDeliveryDate(sizeLetter, zipCode) {
    var body = {
       "getNextAvailDeliveryDateRequest": {
          "customerType": "R",
          "siteId": "18F",
          "sourceSystem": "WEB",
          "skipDateSurchargesFlag": "N",
          "items": {
             "item": {
                "productId": "123",
                "productSku": this.SKU + sizeLetter,
                "zipCode": zipCode,
                "locationType": "1",
                "deliveryDate": "",
                "country": "USA",
                "brandCode": "1001"
             }
          }
       }
    };
    return productrequest('POST', '/getEarliestDeliveryDate', {}, body, null, "product");
  }

  function getDeliveryCalendar(zipCode, startDate, specificDate) {
    if (typeof startDate === 'undefined' || startDate == null) startDate = "";
    else startDate = dateShortString(startDate);

    if (typeof specificDate === 'undefined' || startDate == null) specificDate = "";
    else specificDate = dateShortString(specificDate);

    var body = {
     "getDlvrCalRequest": {
        "country": "USA",
        "deliveryDate": specificDate,
        "locationType": "1",
        "productSku": this.SKU,
        "siteId": "18F",
        "startDate": startDate,
        "zipCode": zipCode,
        "brandCode": "1001"
     }
    };

    return productrequest('POST', '/getDeliveryCalendar', {}, body, null, "product");

  }

  function productrequest(method, path, queryString, body, paging, apiType) {
    if (queryString && queryString.giveResponse) {
      var giveResponse = true;
      delete queryString.giveResponse;
    }
    return issue(method, null, path, queryString, body, paging, options, apiType).then(function (res) {
      console.log("----------------------------RESPONSE STATUS------------------------------");
      console.log(res.statusCode);
      if (res.statusCode < 200 || res.statusCode >= 300) return Promise.reject(res);
      if (res.statusCode == 201 && !res.body) res.body = {};
      if (paging) res.body = wrapPagingResult(res.body, productrequest, [method, path, queryString, body]);
      if (giveResponse) res.body.response = res;
      console.log("RES BODY: " + JSON.stringify(res.body));
      return res.body;
    });
  }

};

var Purchase = module.exports.Purchase = function Purchase(options) {
  //options = _.assign({ version: 'alexa/uat/account/v1' }, options);
  options.transform = options.transform || _.identity;

  return options.transform({
    getShipping: getLogicalOrderShippingCharge,
    getOrderNumber: getNextOrderNumber,
    getTaxes: getTaxes,
    createOrder: createOrderObject,
  }, 'purchase');

  function getLogicalOrderShippingCharge(product, recipient, delivery) {
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
                   "fName": recipient.firstName,
                   "lName": recipient.lastName,
                   "addr1": recipient.addr1,
                   "addr2": recipient.addr2,
                   "city": recipient.city,
                   "state": recipient.state,
                   "postalCode": recipient.postalCode,
                   "country": recipient.country,
                   "locationType": "1",
                   "deliveryDate": delivery.shortDate,
                   "deliveryWindow": "1",
                   "itemPrice": product.itemPrice,
                   "brandCode": "1001",
                   "fsiFlag": "N",
                   "tryMe": "N",
                   "shipNow": "N",
                }
             ]
          }
       }
    };
    return purchaseRequest('POST', '/getLogicalOrderShippingCharge', {}, body, null, "product").then(function(shipping){
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

    return purchaseRequest('POST', '/getNextOrderNumber', {}, body, null, "product").then(function(orderNum){
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

    return purchaseRequest('POST', '/getTaxes', {}, body, null, "product").then(function(taxes){
      var recResult = taxes.getRecipientTaxResponse.getRecipientTaxResult.recipientsResult.recipientResult[0];
      if (recResult.errorCode != "0") {
        return {error:recResult.errorDescription};
      }
      else return recResult.taxAmount;
    });
  }

  function createOrderObject(product, user, recipient, payment, delivery) {
    return getNextOrderNumber().then(function (orderNumber) {
      var testOrder = {
          '@': {
            "xmlns:ord": "http://1800flowers.com/BTOP/OrderFile"
          },
          // "ord:orderFile": {
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
                "ord:cifId": user.systemID, //Waiting on reply from Jyothi
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
              "ord:sourceId": "W0095",
              "ord:sourceCode": "",
              "ord:sourceTypeCode": "",
              "ord:companyCode": "", //WILL BE PROVIDED BY 1800 FLOWERS
              "ord:merchantId": "", //WILL BE PROVIDED BY 1800 FLOWERS
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
              "ord:IPAddress": "", //1800 FLOWERS WILL VERIFY THAT IT IS OK TO OMIT
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
                  "ord:IPAddress": "",
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
          //}
      };
      return testOrder;
    });
  }

  function purchaseRequest(method, path, queryString, body, paging, apiType) {
    if (queryString && queryString.giveResponse) {
      var giveResponse = true;
      delete queryString.giveResponse;
    }
    return issue(method, null, path, queryString, body, paging, options, apiType).then(function (res) {
      console.log("----------------------------RESPONSE STATUS------------------------------");
      console.log(res.statusCode);
      if (res.statusCode < 200 || res.statusCode >= 300) return Promise.reject(res);
      if (res.statusCode == 201 && !res.body) res.body = {};
      if (paging) res.body = wrapPagingResult(res.body, purchaseRequest, [method, path, queryString, body]);
      if (giveResponse) res.body.response = res;
      console.log("RES BODY: " + JSON.stringify(res.body));
      return res.body;
    });
  }
};

function wrapPagingResult(body, reinvoke, args) {
  var self = this;
  body.paging.hasMore = body.paging.offset + body.paging.limit < body.paging.total;
  body.paging.next = function () {
    if (!body.paging.hasMore) return Promise.reject('Over paged');
    var nextPage = { offset: body.paging.offset + body.paging.limit, limit: body.paging.limit };
    return reinvoke.apply(self, args.concat(nextPage));
  };
  return body;
}

function oauthReq(grant_type, values, options) {
  var url = options.endpoint + '/' + options.account + '/' + options.version + '/oauth/token?sig=' + sig(),
      body = _.assign({
    grant_type: grant_type,
    scope: options.oAuthScope,
  }, values),
  startTime = +new Date(),
  headers = {
      "Authorization": "Basic " + options.basicAuth,
      "Accept": 'application/json'
    }
  ;
  if (options.verbose) {
    console.log('OAUTH Request: ', url);
    console.log('OAUTH Body: ', body);
    console.log('OAUTH Headers: ', headers);
  }
  //if(options.verbose) console.log('Request',url);

  return post({
    url: url,
    headers: headers,
    form: body,
    proxy: options.proxy,
    strictSSL: _.has(options, 'strictSSL') ? options.strictSSL : false
  }).then(function (res) {
    if (options.verbose) console.log('Response', url, res.statusCode,+new Date() - startTime + 'ms');
    try {
      var tokens = JSON.parse(res.body);
    } catch (e) {
      if (options.verbose) console.log('Failed to parse', url, '"' + res.body + '"');
      throw e;
    }
    if(options.verbose && options.logsAreInsensitive) console.log('Tokens:',tokens, grant_type);
    return tokens;
  });

  function sig() {
    var secondsSinceEpoch = Math.round(new Date().getTime() / 1000),
        sig = md5('' + options.key + options.secret + secondsSinceEpoch);
    return sig;
  }
}

function issue(method, token, path, queryString, body, paging, options, apiType) {
  var URL = options.endpoint + '/';
  if (apiType == 'customer') {
    URL += options.customer + '/' + options.version + path;
  }
  else if (apiType == 'product') {
    URL += options.product + '/' + options.version + path;
  }
  else if (apiType == 'payment') {
    URL += options.purchase + '/' + options.version + path;
  }
  else {
    URL += options.account + '/' + options.version + path
  }

  var qs = _.map(_.assign({}), function (v, k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(v);
  }).join('&'),
      op = method == 'POST' ? post : get,
      url = URL + '?' + qs,
      startTime = +new Date();
  console.log("ISSUE BODY:");
  console.log(JSON.stringify(body));
  var req = {
    url: url,
    headers: {
      "X-IBM-Client-Id": options.key,
      "X-IBM-Client-Secret": options.secret,
      "Accept": 'application/json'
    },
    strictSSL: _.has(options, 'strictSSL') ? options.strictSSL : false
  };
  if (apiType == 'account' || apiType == 'payment') {
     req.headers.Authorization = "Bearer " + token;
  }
  if (body && method != 'GET') {
    console.log("BODY RECEIVED:");
    console.log(JSON.stringify(body));
    req.json = true;
    req.body = body;
  }
  if(options.verbose) {
    console.log("REQUEST: " + url);
    console.log("HEADERS:");
    console.log(req.headers);
    console.log("BODY:");
    console.log(req.body);
  }
  return op(req).then(function (res) {
    if (options.verbose) {
      console.log("RESPONSE: " + url + " - " + res.statusCode + " - " + (new Date() - startTime) + 'ms');
      console.log("RESPONSE BODY:");
      console.log(JSON.stringify(res.body));
    }
    if (res.body && _.isString(res.body)) {
      try {
        res.body = JSON.parse(res.body);
      } catch (e) {
        if (options.verbose) {
          console.log("FAILED TO PARSE:");
          console.log(res.body);
        }
        throw e;
      }
    }
    return res;
  });
}

function soapRequest(token, uri, sendObject, options) {
  var method = 'POST',
      op = method == 'POST' ? post : get,
      url = uri,
      js2XMLParseOptions = {declaration: {'include': false},prettyPrinting: {'enabled': true}},
      myxml = js2xmlparser('ord:orderFile', sendObject, js2XMLParseOptions),
      startTime = +new Date(),
      body = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Header></soapenv:Header><soapenv:Body>';

  body += myxml += "</soapenv:Body></soapenv:Envelope>";
  var req = {
    url: url,
    headers: {
      "X-IBM-Client-Id": options.key,
      "X-IBM-Client-Secret": options.secret,
      "Content-Type": 'application/xml',
      "Authorization": "Bearer " + token,
      "SOAPAction": "submitOrderFile"
    },
    body: body,
    strictSSL: _.has(options, 'strictSSL') ? options.strictSSL : false
  };
  if(options.verbose) {
    console.log("REQUEST: " + url);
    console.log("HEADERS:");
    console.log(req.headers);
    console.log("BODY:");
    console.log(req.body);
  }
  return op(req).then(function (res) {
    if (options.verbose) {
      console.log("RESPONSE: " + url + " - " + res.statusCode + " - " + (new Date() - startTime) + 'ms');
      console.log("RESPONSE BODY:");
      console.log(res.body);
    }
    if (res.body && _.isString(res.body)) {
        parseString(res.body, function (err, result){
          var requestResult = result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0].orderFileResponse[0];
          console.log("BODY PARSED:");
          console.log(requestResult);
          res.body = requestResult;
          try {
            res.body = JSON.parse(res.body);
          } catch (e) {
            if (options.verbose) {
              console.log("FAILED TO PARSE:");
              console.log(res.body);
            }
            throw e;
          }
          return res;
        });
    }
  });
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

function dateShortString(date) {
  if (typeof date === 'undefined') {
    date = new Date();
  }
  else {
    date = new Date(date);
  }

  var monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ];

  var day = date.getDate();
  var month = date.getMonth();
  var year = date.getFullYear() - 2000;

  if(day<10) {
      day='0'+day
  } 
  
  return day + "-" + monthNames[month] + "-" + year;
}
