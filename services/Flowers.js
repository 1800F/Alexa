'use strict';

var Promise = require('bluebird')
  , path = require('path')
  , fs = require('fs')
  , _ = require('lodash')
  , moment = require('moment')
  , FlowersUser = require('./FlowersUser')
  , issue = require('./api-helpers.js').issue
  , oauthReq = require('./api-helpers.js').oauthReq
  , post = Promise.promisify(require('request').post)
  ;

// Get rid of hard coded creds
// Move tokens around more naturally
// FlowersUser represents the user, not this intermediate thing
// Rename endpoints to be more relevant to flowers
// Tokens for purchase
// Token refresh flow

var Flowers = module.exports = function Flowers(options, tokens) {
  options.transform = options.transform || _.identity;
  tokens = tokens || {};
  var qAuthReq = null;

  var httpOpts = require('https').globalAgent.options;
  httpOpts.ca = (httpOpts.ca || []).concat(fs.readFileSync(__dirname + '/verisign.pem', 'utf8'));

  return options.transform({
    login: login,
    createCustomer: createCustomer,
    addCustomerDetails:addCustomerDetails,
  }, 'app');

  function login(username, password) {
    //Do oauthRequest with defaultCredentials
    return oauthReq('password', { username: '1stevenh@rain.agency', password: '1rainPssword' }, options,'account').then(function (tokens) {
      //If successful, store username and password entered in into options to use for authenticate
      if (tokens.error) return Promise.reject(tokens.error);
      options.username = username;
      options.password = password;
      if(options.verbose && false) console.log("LOGIN OPTIONS: ",options);
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
    return apprequest('POST', '/registerNewCustomer', {} , body, "customer");
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

    return apprequest('POST', '/addPerson', {} , body, "customer");
  }

  function apprequest(method, path, queryString, body, apiType) {
    var args = arguments,
        self = this;
    return getAuthToken()
    .then(function (token) {
      return issue(method, token, path, queryString, body, options, apiType);
    }).then(function (res) {
      if (res.statusCode == 401) {
        //Our token expired
        if (!tokens.access_token) tokens.refresh_token = null; //Must have already tried a refresh, so this next time, go anew
        tokens.access_token = null;
        return apprequest.apply(self, args);
      }
      if (res.statusCode >= 400) return Promise.reject(res.body);
      return res.body;
    });
  }

  function getAuthToken() {
    if (tokens.access_token) return Promise.resolve(tokens.access_token);
    if(qAuthReq) return qAuthReq;
    return qAuthReq = oauthReq('client_credentials', {}, options,'account').then(function (toks) {
      tokens = toks;
      qAuthReq = null;
      return toks.access_token;
    }).catch(function(e){
      qAuthReq = null;
      return Promise.reject(e);
    });
  };
};

module.exports.FlowersUser = FlowersUser;
