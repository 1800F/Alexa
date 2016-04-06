'use strict';

var crypto = require('crypto'),
    algorithm = 'des-ede3-cbc',
    iv = [1, 35, 69, 103, -119, -85, -51, -17];

module.exports = function NewCrypto(options) {
  var cipher = function cipher() {
  	console.log("Algorithm: " + algorithm);
    return crypto.createCipheriv(algorithm, options.encryptKey, new Buffer(iv));
  },
      decipher = function decipher() {
    return crypto.createDecipheriv(algorithm, new Buffer(options.encryptKey, "hex"), new Buffer(iv));
  };
  return {
    encryptCreditCard: function encryptCreditCard(cc) {
      return exports.encryptCreditCard(cc, cipher());
    }
  };
};

exports.encryptCreditCard = function (strCardNumber, cipher) {
	cipher.setAutoPadding(false);
	var crypted = cipher.update(strCardNumber, 'utf8', 'hex') + cipher.final('hex');
	return crypted;
};