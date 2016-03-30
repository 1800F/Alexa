'use strict';

var fs = require('fs'),
    path = require('path');

var rules = fs.readFileSync(path.join(__dirname, 'address-rules.txt'), 'utf8').split(/\r?\n/).map(parseRule).filter(function (x) {
  return x;
});

exports.say = function (address) {
  if (!address) return address;
  return rules.reduce(function (address, rule) {
    return address.replace(rule.regex, rule.to + ' ');
  }, address).trim();
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