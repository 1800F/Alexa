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

  function submitOrder() {
    var testOrder = {
        '@': {
          "xmlns:ord": "http://1800flowers.com/BTOP/OrderFile"
        },
        // "ord:orderFile": {
        "ord:orders": [{
          "ord:orderHeader": {
            "ord:primaryBrand": "1001",
            "ord:orderNumber": "123809",
            "ord:externalOrderNumber": "",
            "ord:externalTransId": "",
            "ord:machineId": "192177225",
            "ord:orderDate": "03/28/2016 10:20:28",
            "ord:thirdPartyToken": {
              "ord:tokenId": "",
              "ord:tokenType": "",
              "ord:tokenDetails1": "",
              "ord:tokenDetails2": "",
            },
            "ord:soldTo": {
              "ord:cifID": "1502088757",
              "ord:houseAccountNumber": "",
              "ord:title": "",
              "ord:firstName": "",
              "ord:lastName": "",
              //"ord:": "",
            }
          },
          "ord:orderDetails": {
            "ord:BrandCode":"FLW",
          },
          "ord:errorFlag": "false"
        }]
        //}
    };

    // var js2XMLParseOptions = {declaration: {'include': false},prettyPrinting: {'enabled': true}};
    // var myxml = js2xmlparser('ord:orderFile', testOrder, js2XMLParseOptions);
    // console.log("TESTORDER XML:");
    // console.log(myxml);

    return getUserAuthToken().then(function (token) {
      return soapRequest(token, 'https://ecommerce.800-flowers.net/alexa/uat/submitOrder/v1', testOrder, options);
    });    

    // soap.createClient(wsdl, function(err, client) {
    //   if (err) {
    //     console.log("ERROR CREATING CLIENT: " + err);
    //     return err;
    //   }
    //   else {
    //     getUserAuthToken().then(function (token) {
    //       client.setSecurity(new soap.BearerSecurity(token));
    //       console.log("CLIENT FOLLOWS:");
    //       console.log(client);
    //       client.submitOrderFile(testOrder, function(err, result, body) {
    //           if (err) {
    //             console.log('Error Submitting: ' + err);
    //             return err;
    //           }
    //           else {
    //             parseString(body, function (err, result){
    //               var requestResult = result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0].orderFileResponse[0];
    //               console.log("BODY PARSED:");
    //               console.log(requestResult);
    //               return requestResult;
    //             })
    //           }
    //       });
    //     });
    //   }
    // });

    // console.log('Submit order body',JSON.stringify(body,null,2));
    //return userrequest('POST', '/me/stores/' + storeNumber + '/orderToken/' + orderToken + '/submitOrder', {}, body);
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

  function getLogicalOrderShippingCharge() {

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

module.exports.ERROR_CODES = {
  "InsufficientBalance": "341014"
};
module.exports.HISTORYTYPES = ['ScvTransaction', 'Point', 'SvcTransactionWithPoints', 'Coupon'];
module.exports.PURCHASEHISTORYTYPES = ['ScvTransaction', 'SvcTransactionWithPoints'];
module.exports.PRODUCTTYPES = {
  beverage: 11,
  food: 13,
  coffee: 9
};

module.exports.ProductTypePredicates = _.fromPairs(_.map(module.exports.PRODUCTTYPES, buildProductTypePredicate));

function buildProductTypePredicate(number, name) {
  return ['is' + name.substring(0, 1).toUpperCase() + name.substring(1, name.length), function (query) {
    return query == number || query && query.toLowerCaswe && query.toLowerCase() == name;
  }];
}

function dateAsTimestamp(date) {
  if (typeof date === 'undefined') {
    date = new Date();
  }


}
