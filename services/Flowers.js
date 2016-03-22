'use strict';

var Promise = require('bluebird'),
    post = Promise.promisify(require('request').post),
    get = Promise.promisify(require('request').get),
    aws = require('aws-sdk'),
    md5 = require('md5'),
    _ = require('lodash'),
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
    process.stdout.write('dynamo: ' + options.dynamoID + "\r");
    return oauthReq('password', { username: username, password: password }, options).then(function (tokens) {
      if (tokens.error) return Promise.reject(tokens.error);
      options = _.assign({ username: username }, options);
      options = _.assign({ password: password }, options);
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
    return apprequest('POST', '/registerNewCustomer', {} , body, null, true);
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
            "startDate":new Date(),
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

    return apprequest('POST', '/addPerson', {} , body, null, true);
  }

  function dynamoLogin(alexaUserID) {
    //Get email and password from DynamoDB
    aws.config.update({accessKeyId: options.dynamoID, secretAccessKey: options.dynamoSecret});
    //Login using those credentials and authenticate?
  }

  function forgotUsername(email) {
    return apprequest('POST', '/login/forgot-username', {}, { emailAddress: email });
  }

  function resetPassword(username, email) {
    return apprequest('POST', '/login/forgot-password', {}, { userName: username, emailAddress: email });
  }

  function apprequest(method, path, queryString, body, paging, isCustomerAPI) {
    var args = arguments,
        self = this;
    return getAuthToken()
    .then(function (token) {
      return issue(method, token, path, queryString, body, paging, options, isCustomerAPI);
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
    return userrequest('POST', '/authenticateUser', {}, body);
  }

  function refresh() {
    return oauthReq('refresh_token', { refresh_token: tokens.refresh_token }, options).then(function (toks) {
      tokens = toks;
      return toks;
    });
  }

  function getPaymentMethods(customerID) {
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
        "AdminPartyId":customerID,
        "InquiryLevel":"4"
      }
    };
    return userrequest('POST', '/getSavedCC', {}, body);
  }

  function getRecipients(customerID) {
    var body = {
      "getMDMRecipients":{
        "contid":"154145799461739490"
      }
    };
    return userrequest('POST', '/getRecipients', {}, body);
  }

  function getRecipientAddress(demographicsID, customerID) {
    var body = {
      "getMDMRecipientAddresses":{
        "demographicsID":demographicsID,
        "contid":customerID
      }
    };
    return userrequest('POST', '/getRecipientAddress', {}, body);
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
    return userrequest('POST', '/getCustomerDetails', {}, body);
  }

  function submitOrder(storeNumber, orderToken, svcId, amount, signature) {
    var body = {
      tenders: [{
        type: 'SVC',
        id: svcId,
        amountToCharge: amount
      }],
      signature: signature
    };
    // console.log('Submit order body',JSON.stringify(body,null,2));
    return userrequest('POST', '/me/stores/' + storeNumber + '/orderToken/' + orderToken + '/submitOrder', {}, body);
  }

  function userrequest(method, path, queryString, body, paging, isCustomerAPI) {
    if (queryString && queryString.giveResponse) {
      var giveResponse = true;
      delete queryString.giveResponse;
    }
    process.stdout.write('qs: ' + queryString.client_id + "\r");
    return getUserAuthToken()
    .then(function (token) {
      return issue(method, token, path, queryString, body, paging, options, isCustomerAPI);
    }).then(function (res) {
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
    scope: options.oAuthScope
  }, values),
  startTime = +new Date()
  ;
  if (options.verbose) process.stdout.write('Request: ' + url + "\rGrantType: " + body.grant_type + "\rid: " + body.client_id + "\rSecret: " + body.client_secret + "\rUsername: " + body.username + "\rPass: " + body.password + "\rAuth: " + options.basicAuth + "\r");
  //if(options.verbose) console.log('Request',url);

  return post({
    url: url,
    headers: {
      "Authorization": "Basic " + options.basicAuth,
      "Accept": 'application/json'
    },
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

function issue(method, token, path, queryString, body, paging, options, isCustomerAPI) {
  var qs = _.map(_.assign({}), function (v, k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(v);
  }).join('&'),
      op = method == 'POST' ? post : get,
      url = isCustomerAPI ? (options.endpoint + '/' + options.customer + '/' + options.version + path + '?' + qs) : (options.endpoint + '/' + options.account + '/' + options.version + path + '?' + qs),
      startTime = +new Date();
  process.stdout.write("Body Issue: " + body + "\rMethod:" + method + "\r");
  var req = {
    url: url,
    headers: {
      "X-IBM-Client-Id": options.key,
      "X-IBM-Client-Secret": options.secret,
      "Accept": 'application/json'
    },
    strictSSL: _.has(options, 'strictSSL') ? options.strictSSL : false
  };
  if (!isCustomerAPI) {
     req.headers.Authorization = "Bearer " + token;
  }
  if (body && method != 'GET') {
    process.stdout.write("Body Received: " + body + "\r");
    req.json = true;
    req.body = body;
  }
  if(options.verbose) {
    process.stdout.write('Request ' + url + ": " + "\rHeaders: " + req.headers.Authorization + "\rBody: " + req.body + "\r");
  } 
  return op(req).then(function (res) {
    if (options.verbose) {
      process.stdout.write('Response ' + url + ":" + res.statusCode + " - " + (new Date() - startTime) + 'ms'+ "\r");
      process.stdout.write('Body: ' + res.body + "\r");
    } 
    if (res.body && _.isString(res.body)) {
      try {
        res.body = JSON.parse(res.body);
      } catch (e) {
        if (options.verbose) process.stdout.write('Failed to parse ' + url + ' - "' + res.body + '"'+ "\r");
        throw e;
      }
    }
    return res;
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

function outputBody(body) {
  for(var key in body) {
    var obj = body[key];
    for (var prop in obj) {
        process.stdout.write(prop + ":" + body[prop] + "\r");
    }
  }
}
