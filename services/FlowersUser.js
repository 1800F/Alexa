var Promise = require('bluebird')
  , _ = require('lodash')
  , issue = require('./api-helpers.js').issue
  , oauthReq = require('./api-helpers.js').oauthReq
  , parseString = require('xml2js').parseString
  , moment = require('moment')
  , js2xmlparser = require("js2xmlparser")
  , post = Promise.promisify(require('request').post)
  , Purchase = require('./Purchase.js')
;

var FlowersUser = module.exports = function FlowersUser(options, tokens, systemID, customerID) {
  options.transform = options.transform || _.identity;
  if (_.isString(tokens)) tokens = { access_token: tokens };

  return options.transform({
    get tokens() { return tokens; },
    get systemID() { return systemID; },
    get customerID() { return customerID; },
    // resetToken: resetToken, //FOR DEBUGGING ISSUE WITH OAUTH ONLY -- REMOVE BEFORE PUSHING LIVE
    authenticate: authenticate,
    getPaymentMethods: getPaymentMethods,
    getRecipients: getRecipients,
    getRecipientAddress: getRecipientAddress,
    getCustomerDetails: getCustomerDetails,
    submitOrder: submitOrder // Why is this in the order and not in Purchase?
  }, 'user');

  // function resetToken() {
  //   tokens.access_token = 'bad token';
  // }

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
        "SourceId":"W0097",
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
      // if (options.verbose) console.log("Recipients: " + JSON.stringify(body.MDMRecipientsResponse));
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
        firstName: body.name.givenNameOne,
        lastName: body.name.lastName,
        address: processAddress(body.address),
        phone: processPhone(body.contactMethod),
        email: body.identification.number
      };

      function processPhone(contactMethod) {
        // This is an array, so we should get the first one
        if(!contactMethod || contactMethod.length == 0 || !contactMethod[0].contactMethod) return null;
        contactMethod = contactMethod[0].contactMethod;
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

  /**
   * It will return an object with the following structure depends of the case
   * - For Error {"flwsErrors":[{"flwsError":[{"errorCode":["2526"],"errorMessage":["Invalid Service Charge"],"errorType":[""]}]}]}
   * - For Success {"message":["OrderSubmitted :7760000028"]}
   */
  function submitOrder(product, recipient, payment) {
    var purchase = Purchase(options)
      , user = {
          displayName: null
          , address: {
            addr1: null
            , addr2: null
            , city: null
            , state: null
            , country: null
            , postalCode: null
          }
          , phone: null
          , email: null
        }
      ;
    return this.getCustomerDetails().then(function(userProfile) {
      user.displayName = userProfile.displayName;
      user.firstName = userProfile.firstName;
      user.lastName = userProfile.lastName;
      user.phone = userProfile.phone;
      user.email = userProfile.email;
      if (userProfile.address) {
        user.address.addr1 = userProfile.address.addr1;
        user.address.addr2 = userProfile.address.addr2;
        user.address.city = userProfile.address.city;
        user.address.state = userProfile.address.state;
        user.address.country = userProfile.address.country;
        user.address.postalCode = userProfile.address.postalCode;
      }
      return purchase.authorizeCC(payment, product.total, user)
        .then(function(authorization) {
          // Error
          if (authorization.authCode.trim() != 100) {
            return authorization.errors.error;
          }
          payment.authType = authorization.authVerificationCode;
          return purchase.createOrder(product, user, recipient, payment)
            .then( function(order) {
              return getUserAuthToken()
                .then(function (token) {
                  return soapRequest(token, 'submitOrder', order, options)
                    .then(function(order) {
                      return order[0];
                    });
                });
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
      if (res.statusCode < 200 || (res.statusCode >= 300 && res.statusCode != 401)) return Promise.reject(res);
      if (res.statusCode == 201 && !res.body) res.body = {};
      if (res.statusCode == 401) {
        //Our token is invalid, get a new token
        return qAuthReq = oauthReq('password' ,options.defaultCredentials , options,'account').then(function (toks) {
          qAuthReq = null;
          if(toks.error) return Promise.reject(toks.error);
          tokens.access_token = toks.access_token;
          return issue(method, tokens.access_token, path, queryString, body, options, apiType);
        }).catch(function(e){
          qAuthReq = null;
          tokens.access_token = null;
          return Promise.reject(e);
        });
      }
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
      url = options.endpoint + '/' + uri + '/' + options.version,
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
