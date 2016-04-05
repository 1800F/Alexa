'use strict';

var Promise = require('bluebird')
  , path = require('path')
  , _ = require('lodash')
  , moment = require('moment')
  , FlowersUser = require('./FlowersUser')
  , issue = require('./api-helpers.js').issue
  , oauthReq = require('./api-helpers.js').oauthReq
  , post = Promise.promisify(require('request').post)
  ;

// Get rid of hard coded creds
// Purchase stores token instead of passing it
// FlowersUser represents the user, not this intermediate thing
// Token refresh flow for Flowers
// Rename endpoints to be more relevant to flowers

var Flowers = module.exports = function Flowers(options, tokens) {
  options.transform = options.transform || _.identity;
  tokens = tokens || {};
  var qAuthReq = null;

  return options.transform({
    login: login,
    buildUser: buildUser,
    createCustomer: createCustomer,
    addCustomerDetails:addCustomerDetails,
  }, 'app');

  function buildUser(systemID, customerID) {
    return getAuthToken().then(function(tokens){
      return FlowersUser(options, tokens, systemID, customerID);
    });
  }

  function login(username, password) {
    // This BRILLIANT API does not actually validate the username and password with the authenticate
    // endpoint
    return getSpecificAuthToken(username,password).then(function(tokens){
      if (tokens.error) return Promise.reject(tokens.error);
      var user = FlowersUser(options, tokens);
      return user.authenticate(username,password).then(_.constant(user));
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
    return qAuthReq = oauthReq('password' ,options.defaultCredentials , options,'account').then(function (toks) {
      qAuthReq = null;
      if(toks.error) return Promise.reject(toks.error);
      tokens = toks;
      return toks.access_token;
    }).catch(function(e){
      qAuthReq = null;
      return Promise.reject(e);
    });
  };

  function getSpecificAuthToken(username, password) {
    return oauthReq('password' ,{username: username , password: password} , options,'account').then(function (toks) {
      if(toks.error) return Promise.reject(toks.error);
      return toks.access_token;
    });
  };
};

module.exports.FlowersUser = FlowersUser;
