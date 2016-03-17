'use strict';

var Promise = require('bluebird'),
    post = Promise.promisify(require('request').post),
    get = Promise.promisify(require('request').get),
    md5 = require('md5'),
    _ = require('lodash'),
    countryCode = 'US',
    localeCode = 'en-us'
    ;

var Flowers = module.exports = function Flowers(options, tokens) {
  options = _.assign({ version: 'v1' }, options);
  options.transform = options.transform || _.identity;
  tokens = tokens || {};
  var qAuthReq = null;

  return options.transform({
    forgotUsername: forgotUsername,
    resetPassword: resetPassword,
    getStore: getStore,
    getStoreByNumber: getStoreByNumber,
    listStores: listStores,
    listFood: listFood,
    getProductStatus: getProductStatus,
    getProductBySku: getProductBySku,
    getProductDetailsBySku: getProductDetailsBySku,
    login: login,
    createUser: createUser,
    auth: getAuthToken,
    User: function User(tokens) {
      return FlowersUser(options, tokens);
    }
  }, 'app');

  function login(username, password) {
    return oauthReq('password', { username: username, password: password }, options).then(function (tokens) {
      if (tokens.error) return Promise.reject(tokens.error);
      return FlowersUser(options, tokens);
    });
  }

  function createUser(userObj) {
    return apprequest('POST', '/account/create', { market: countryCode }, userObj);
  }

  function getProductBySku(sku) {
    return apprequest('GET', '/products/' + countryCode + '/' + sku, {}, {});
  }

  function getProductDetailsBySku(sku, productType) {
    if (!productType) return apprequest('GET', '/products/' + countryCode + '/' + sku, {}, {});
    if (module.exports.ProductTypePredicates.isBeverage(productType)) return apprequest('GET', '/products/' + countryCode + '/beverages/sku/' + sku);
    if (module.exports.ProductTypePredicates.isFood(productType)) return apprequest('GET', '/products/' + countryCode + '/food/sku/' + sku);
    if (module.exports.ProductTypePredicates.isCoffee(productType)) return apprequest('GET', '/products/' + countryCode + '/coffee/sku/' + sku);
    return apprequest('GET', '/products/' + countryCode + '/' + sku, {}, {});
  }

  function getProductStatus(storeNumber, skus) {
    if (!_.isString(storeNumber)) throw new Error('Expected storeNumber to be a string, but got ' + JSON.stringify(storeNumber));
    skus = _.map(skus, function (sku) {
      if (_.isString(sku)) return { quantity: 1, commerce: { sku: sku } };
      return sku;
    });
    var body = { items: skus };
    return apprequest('POST', '/products/status/' + storeNumber, {}, body);
  }

  function getStore(id) {
    return apprequest('GET', '/stores/' + id, {}, {});
  }

  function getStoreByNumber(storeNumber) {
    return apprequest('GET', '/stores/number/' + storeNumber, { xopState: true }, {});
  }

  function listStores(featureCodes, paging) {
    featureCodes = featureCodes || {};
    return apprequest('GET', '/stores', { xopState: true, featureCodes: featureCodes.join(',') }, {}, paging || true);
  }

  function listFood(paging) {
    return apprequest('GET', '/products/' + countryCode + '/food', {}, {}, paging || true);
  }

  function forgotUsername(email) {
    return apprequest('POST', '/login/forgot-username', {}, { emailAddress: email });
  }

  function resetPassword(username, email) {
    return apprequest('POST', '/login/forgot-password', {}, { userName: username, emailAddress: email });
  }

  function apprequest(method, path, queryString, body, paging) {
    var args = arguments,
        self = this;
    return getAuthToken()
    .then(function (token) {
      return issue(method, token, path, queryString, body, paging, options);
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
  options = _.assign({ version: 'v1' }, options);
  options.transform = options.transform || _.identity;
  if (_.isString(tokens)) tokens = { access_token: tokens };

  return options.transform({
    get tokens() {
      return tokens;
    },
    refresh: refresh,
    getPrimaryCard: getPrimaryCard,
    getCardBalanceRealTime: getCardBalanceRealTime,
    getPaymentMethods: getPaymentMethods,
    getPaymentMethod: getPaymentMethod,
    getOrders: getOrders,
    getProfile: getProfile,
    setAccountSetting: setAccountSetting,
    getAccountSetting: getAccountSetting,
    getAccountSettings: getAccountSettings,
    getOrderStore: getOrderStore,
    submitOrder: submitOrder,
    reloadCard: reloadCard,
    createAddress: createAddress,
    registerDigitalCard: registerDigitalCard,
    createPaymentMethod: createPaymentMethod
  }, 'user');

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

  function registerDigitalCard() {
    return userrequest('POST', '/me/cards/register-digital', {}, null);
  }

  function createAddress(address) {
    return userrequest('POST', '/me/addresses', { giveResponse: true }, address).then(function (body) {
      var res = body.response;
      delete body.response;
      var loc = res.headers.location;
      return loc.substr(loc.lastIndexOf('/') + 1);
    });
  }

  function createPaymentMethod(paymentMethod) {
    return userrequest('POST', '/me/paymentmethods', {}, paymentMethod);
  }

  function reloadCard(cardId, amount, paymentMethodId) {
    var body = {
      amount: amount,
      paymentMethodId: paymentMethodId
    };
    return userrequest('POST', '/me/cards/' + cardId + '/reload', {}, body);
  }

  function getOrderStore(storeNumber, items) {
    var body = { cart: { items: items } };
    return userrequest('POST', '/me/stores/' + storeNumber + '/priceOrder', {}, body);
  }

  function setAccountSetting(bucket, key, value) {
    return userrequest('POST', '/me/data/' + bucket, { platform: options.platform }, { key: key, value: value });
  }

  function getAccountSetting(bucket, key) {
    return userrequest('GET', '/me/data/' + bucket + '/' + key, { platform: options.platform }, null);
  }

  function getAccountSettings(bucket) {
    return userrequest('GET', '/me/data/' + bucket, { platform: options.platform }, null);
  }

  function getProfile() {
    return userrequest('GET', '/me/profile');
  }

  function getPrimaryCard() {
    return userrequest('GET', '/me/cards/primary', {}).catch(function (res) {
      if (res.statusCode == 404) return null;
      return Promise.reject(res);
    });
  }

  function getCardBalanceRealTime(cardId) {
    return userrequest('GET', '/me/cards/' + cardId + '/balance-realtime', {}, null);
  }

  function getPaymentMethods() {
    return userrequest('GET', '/me/paymentmethods', {}, null);
  }

  function getPaymentMethod(id) {
    return userrequest('GET', '/me/paymentmethods/' + id, {}, null);
  }

  function getOrders(paging) {
    return userrequest('GET', '/me/orders', {}, null, paging || true);
  }

  function userrequest(method, path, queryString, body, paging) {
    if (queryString && queryString.giveResponse) {
      var giveResponse = true;
      delete queryString.giveResponse;
    }
    return getUserAuthToken()
    .then(function (token) {
      return issue(method, token, path, queryString, body, paging, options);
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

  function refresh() {
    return oauthReq('refresh_token', { refresh_token: tokens.refresh_token }, options).then(function (toks) {
      tokens = toks;
      return toks;
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
  //process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  var url = options.endpoint + '/alexa/uat/account/' + options.version + '/oauth/token',
      body = _.assign({
    grant_type: grant_type,
    client_id: options.key,
    client_secret: options.secret
  }, values),
  startTime = +new Date()
  ;
  if (options.verbose) process.stdout.write('Request: ' + url + "\rGrantType: " + body.grant_type + "\rid: " + body.client_id + "\rSecret: " + body.client_secret + "\rUsername: " + body.username + "\rPass: " + body.password + "\r");
  //if(options.verbose) console.log('Request',url);

  return post({
    url: url,
    headers: {
      "X-API-KEY": options.key,
      "Accept": 'application/json'
    },
    form: body,
    proxy: options.proxy,
    strictSSL: _.has(options, 'strictSSL') ? options.strictSSL : true
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

function issue(method, token, path, queryString, body, paging, options) {
  var qs = _.map(_.assign({ access_token: token }, paging, queryString), function (v, k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(v);
  }).join('&'),
      op = method == 'POST' ? post : get,
      url = options.endpoint + '/' + options.version + path + '?' + qs,
      startTime = +new Date();
  //if(options.verbose) console.log('Request',url,body);
  var req = {
    url: url,
    headers: {
      "X-API-KEY": options.key,
      "Accept": 'application/json'
    },
    proxy: options.proxy,
    strictSSL: _.has(options, 'strictSSL') ? options.strictSSL : true
  };
  if (body && method != 'GET') {
    req.json = true;
    req.body = body;
  }
  return op(req).then(function (res) {
    if (options.verbose) console.log('Response', url, res.statusCode, +new Date() - startTime + 'ms');
    if (res.body && _.isString(res.body)) {
      try {
        res.body = JSON.parse(res.body);
      } catch (e) {
        if (options.verbose) console.log('Failed to parse', url, '"' + res.body + '"');
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
