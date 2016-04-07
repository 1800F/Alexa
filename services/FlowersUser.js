var Promise = require('bluebird')
  , _ = require('lodash')
  , issue = require('./api-helpers.js').issue
  , parseString = require('xml2js').parseString
  , moment = require('moment')
  , js2xmlparser = require("js2xmlparser")
  , post = Promise.promisify(require('request').post)
;

var FlowersUser = module.exports = function FlowersUser(options, tokens, systemID, customerID) {
  options.transform = options.transform || _.identity;
  if (_.isString(tokens)) tokens = { access_token: tokens };

  return options.transform({
    get tokens() { return tokens; },
    get systemID() { return systemID; },
    get customerID() { return customerID; },
    authenticate: authenticate,
    getPaymentMethods: getPaymentMethods,
    getRecipients: getRecipients,
    getRecipientAddress: getRecipientAddress,
    getCustomerDetails: getCustomerDetails,
    submitOrder: submitOrder // Why is this in the order and not in Purchase?
  }, 'user');

  // Beware. While this endpoint accepts a user, it doesn't actually validate it
  function authenticate(username, password) {
    var body = {
      "authenticateCustomer": {
        "customerDetail": {
          "customerID": username,
          "password": password,
          "saltId": "",
          "sourceSystem": "FDWEB"
        }
      }
    };
    return userrequest('POST', '/authenticateUser', {}, body, "account").then(function(authenticateUser){
      systemID = authenticateUser.authenticateCustomerResponse.customerData.systemID;
    });
  }

  function getPaymentMethods() {
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
    return userrequest('POST', '/getSavedCC', {}, body, "account").then(function(body){
      var val = _.at(body,'GetSavedCardsForCustomerResponse.result.response.financialProfile.chargeCard');
      if(!val.length) return null;
      return _.map(val[0],function(card){
        var card = _.pick(card,['idPK','number','type','cardExpiryDate','nameOnCard'])
        card.id = card.idPK;
        return card;
      });
    });
  }

  function getRecipients() {
    var body = {
      "getMDMRecipients":{
        "contid": customerID
      }
    };
    return userrequest('POST', '/getRecipients', {}, body, "account").then(function (body) {
      return body.MDMRecipientsResponse.MDMRecipients.MDMRecipient;
    });
  }

  function getRecipientAddress(demographicsID) {
    var body = {
      "getMDMRecipientAddresses":{
        "demographicsID": demographicsID,
        "contid": customerID
      }
    };
    return userrequest('POST', '/getRecipientAddress', {}, body, "account")
    .then(function(addressEnvelope){
      var addr = addressEnvelope.MDMRecipientAddressesResponse.MDMRecipientAddresses.MDMRecipientAddress;
      var address = {
        firstName: addr.FirstName,
        lastName: addr.LastName,
        addr1: addr.LineOne,
        addr2: addr.LineTwo,
        city: addr.City,
        state: addr.StateProvince,
        postalCode: addr.PostalCode,
        country: addr.CountryCode,
      };
      return address;
    });

  }

  function getCustomerDetails() {
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
    return userrequest('POST', '/getCustomerDetails', {}, body, "account")
    .then(function(body){
      if(!body.Get18FCustomerByAdminSysKeyResponse.result.status.processingStatus.value == 'SUCCESS') return Promise.reject(body);
      body = body.Get18FCustomerByAdminSysKeyResponse.result.response;
      customerID = body.idPK;
      return {
        customerID: body.idPK,
        displayName: body.displayName,
        address: processAddress(body.address),
        phone: processPhone(body.contactMethod)
      };

      function processPhone(contactMethod) {
        if(!contactMethod || !contactMethod.contactMethod) return null;
        contactMethod = contactMethod.contactMethod;
        return contactMethod.referenceNumber;
      }
      function processAddress(address) {
        if(!address || !address.address) return null;
        address = address.address;
        return {
          addr1: address.addressLineOne,
          addr2: null,
          city: address.city,
          state: address.stateProvince.code,
          postalCode: address.zipPostalCode,
          country: address.country.code
        }
      }
    });
  }

  function submitOrder(product, recipient, user, payment, delivery) {
    var purchase = Flowers.Purchase(options);
    return purchase.createOrder(product, recipient, user, payment, delivery).then( function(testOrder) {
      return getUserAuthToken().then(function (token) {
        return soapRequest(token, 'https://ecommerce.800-flowers.net/alexa/uat/submitOrder/v1', testOrder, options).then(function(order) {
          console.log("ORDER PROCESSED: " + JSON.stringify(order));
          if (order[0].flwsErrors[0].flwsError[0].errorMessage[0]) {
            return {error: order[0].flwsErrors[0].flwsError[0].errorMessage[0]};
          }
          else
            return order[0];
        });
      });
    });
  }

  function userrequest(method, path, queryString, body, apiType) {
    if (queryString && queryString.giveResponse) {
      var giveResponse = true;
      delete queryString.giveResponse;
    }
    return getUserAuthToken()
    .then(function (token) {
      return issue(method, token, path, queryString, body, options, apiType);
    }).then(function (res) {
      if (res.statusCode < 200 || res.statusCode >= 300) return Promise.reject(res);
      if (res.statusCode == 201 && !res.body) res.body = {};
      if (giveResponse) res.body.response = res;
      return res.body;
    });
  }

  function getUserAuthToken() {
    return Promise.resolve(tokens.access_token);
  }
};

function soapRequest(token, uri, sendObject, options) {
  var method = 'POST',
      op = method == 'POST' ? post : get,
      url = uri,
      js2XMLParseOptions = {declaration: {'include': false},prettyPrinting: {'enabled': true}},
      myxml = js2xmlparser('ord:orderFile', sendObject, js2XMLParseOptions),
      startTime = +new Date(),
      body = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ord="http://1800flowers.com/BTOP/OrderFile"><soapenv:Header></soapenv:Header><soapenv:Body>';

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
    strictSSL: _.has(options, 'strictSSL') ? options.strictSSL : true,
    proxy: options.proxy,
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
          try {
            var requestResult = result['soapenv:Envelope']['soapenv:Body'][0].orderFileResponse[0].orderFileResponseResult;
            console.log("BODY PARSED:");
            console.log(JSON.stringify(requestResult));
            res.body = requestResult;
          } catch (e) {
            if (options.verbose) {
              console.log("FAILED TO PARSE:");
              console.log(res.body);
            }
            throw e;
          }
        });
    }
    return res.body;
  });
}
