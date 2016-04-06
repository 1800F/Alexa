'use strict';

var url = require('url'),
    crypto = require('crypto'),
    algorithm = 'aes-256-ctr';

module.exports = function OAuthHelper(options) {
  var cipher = function cipher() {
    return crypto.createCipher(algorithm, options.codeKey);
  },
      decipher = function decipher() {
    return crypto.createDecipher(algorithm, options.codeKey);
  };
  return {
    redirectTo: function redirectTo(state, code) {
      console.log("redirect to 1");
      return exports.redirectTo(state, code, options.redirectUrl, cipher());
    },
    encryptTokens: function encryptTokens(tokens) {
      return exports.encryptTokens(tokens, cipher());
    },
    decryptCode: function decryptCode(code) {
      return exports.decryptCode(code, decipher());
    },
    authenticate: function authenticate(creds) {
      return exports.authenticate(creds, options.clientId, options.clientSecret);
    }
  };
};

exports.authenticate = function (credentials, clientId, clientSecret) {
  return credentials.name == clientId && credentials.pass == clientSecret;
};

exports.encryptTokens = function (tokens, cipher) {
  var data = JSON.stringify(tokens);
  var crypted = cipher.update(data, 'utf8', 'base64') + cipher.final('base64');
  return crypted;
};

exports.decryptCode = function (code, decipher) {
  code = decodeURIComponent(code);
  var decrypted = decipher.update(code, 'base64', 'utf8');
  decipher.final('utf8');
  return JSON.parse(decrypted);
};

exports.redirectTo = function (state, code, redirectUrl) {
  console.log('redirect to');
  var uri = url.parse(redirectUrl, true);
  console.log('parse');
  delete uri.search;
  uri.query.state = state;
  uri.query.code = code;
  return url.format(uri);
};