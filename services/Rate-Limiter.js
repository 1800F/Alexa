"use strict";
var Promise = require('bluebird');

var RateLimiter = module.exports = function RateLimiter(cps) {
  var takes = [];
  return take;

  function take() {
    var now = new Date().getTime();
    takes = pruneTakes(takes, now);
    if (takes.length >= cps) {
      var wait = now - takes[0];
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          take().then(resolve).catch(reject);
        }, wait);
      });
    } else {
      takes.push(now);
      return Promise.resolve();
    }
  }
};

function pruneTakes(takes, now) {
  var before = now - 1000;
  return takes.filter(function (take) {
    return take >= now - 1000;
  });
}
