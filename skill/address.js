'use strict';

var fs = require('fs'),
    path = require('path'),
    _ = require('lodash');

var rules = fs.readFileSync(path.join(__dirname, 'address-rules.txt'), 'utf8').split(/\r?\n/).map(parseRule).filter(function (x) {
  return x;
});

exports.fromPipes = function(address){
  // e.g. "24 S Center Street|||Spanish Fork|UT|84660|US"
  var parts = address.split('|');
  return {
    line1: parts[0],
    line2: parts[1],
    line3: parts[2],
    city: parts[3],
    state: parts[4],
    zip: parts[5],
    country: parts[6],
  }
}

exports.say = function (address) {
  if (!address) return address;
  if(_.isObject(address)) address = _.compact([address.line1, address.line2, address.line3, address.city]).join(' ');
  return rules.reduce(function (address, rule) {
    return address.replace(rule.regex, rule.to + ' ');
  }, address).trim();
};

exports.isDeliverable = function (address) {
  return true;
};

function parseRule(rule) {
  if (!rule) return null;
  rule = rule.trim();
  if (rule.lastIndexOf('//', 0) == 0) return null;
  var i = rule.indexOf('>'),
      from = rule.substring(0, i).trim(),
      to = rule.substring(i + 1, rule.length).trim(),
      endsWithWord = !!from.substring(from.length - 1).match(/\w/i),
      regex = '\\b' + from.replace('.', '\\.') + '(\\s+)?' + (endsWithWord ? '\\b' : '');
  return {
    from: from,
    regex: new RegExp(regex, 'ig'),
    to: to
  };
}