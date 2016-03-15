'use strict';

var fs = require('fs')
  , path = require('path')
  , _ = require('lodash')
  , pathToZipFile = path.join(__dirname, '..', 'data', 'zipcode.csv')
  , moment = require('moment-timezone')
  , csvparse = require('csv-parse')
  , codes = null
;

csvparse(fs.readFileSync(pathToZipFile), {
  skip_empty_lines: true,
  columns: ["zip", "city", "state", "latitude", "longitude", "timezone", "dst"]
},function(err,data){
  if(err) return console.error('Error parsing csv zip code file', err.stack || err);
  var lines = _.tail(data);
  codes = _.fromPairs(_.map(lines, function (l) {
    return [l.zip, [+l.timezone, !! +l.dst]];
  }));
});



// Returns either null, or an offset from UTC
exports.getOffset = function getOffset(zipcode, date) {
  zipcode = _.isString(zipcode) ? zipcode : '' + zipcode;
  if (zipcode.length < 5) zipcode = _.repeat('0', 5 - zipcode.length) + zipcode;
  var base = codes[zipcode];
  if (!base) return null;
  var isDSTNow = moment.tz('America/Los_Angeles').isDST(); //HACK! Hard-coding TZ calculation for the US. But hey, zips are US only too.
  return base[0] * 60 + (isDSTNow && base[1] ? 60 : 0);
};

// Returns either null or a moment with the time
exports.getLocalTime = function getLocalTime(zipcode, date) {
  var offset = exports.getOffset(zipcode, date);
  if (!offset) return null;
  return moment.utc(date).utcOffset(offset);
};
