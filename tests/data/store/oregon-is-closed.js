'use strict';

var moment = require('moment'),
    _ = require('lodash'),
    format = "YYYY-MM-DDTHH:mm:ss.SSS",
    now = moment().format(),
    today = moment(now).startOf('day').format(),
    next7Days = _.range(1, 8).map(function (d) {
  return moment(today).add(d, 'days').format();
});

module.exports = {
  "id": "17049",
  "name": "NW Town Center Dr & Tanasbourne Dr",
  "brandName": "Starbucks",
  "storeNumber": "14026-108060",
  "phoneNumber": "(503) 617-4586",
  "ownershipTypeCode": "CO",
  "market": "US",
  "operatingStatus": {
    "operating": true,
    "openDate": "6/8/2007 12:00:00 AM",
    "closeDate": null,
    "status": "ACTIVE"
  },
  "address": {
    "streetAddressLine1": "2711 NW Town Center Dr. #1",
    "streetAddressLine2": null,
    "streetAddressLine3": null,
    "city": "Beaverton",
    "countrySubdivisionCode": "OR",
    "countryCode": "US",
    "postalCode": "970068951"
  },
  "coordinates": {
    "latitude": 45.539192,
    "longitude": -122.86656
  },
  "features": [{
    "code": "DT",
    "name": "Drive-Through"
  }, {
    "code": "WA",
    "name": "Oven-warmed Food"
  }, {
    "code": "VS",
    "name": "Verismo"
  }, {
    "code": "CD",
    "name": "Mobile Payment"
  }, {
    "code": "DR",
    "name": "Digital Rewards"
  }, {
    "code": "LB",
    "name": "La Boulange"
  }, {
    "code": "GO",
    "name": "Google Wi-Fi"
  }, {
    "code": "XO",
    "name": "Mobile Order and Pay"
  }, {
    "code": "MX",
    "name": "Music Experience"
  }],
  "regulations": [],
  "timeZoneInfo": {
    "currentTimeOffset": -480,
    "windowsTimeZoneId": "Pacific Standard Time",
    "olsonTimeZoneId": "GMT-08:00 America/Los_Angeles"
  },
  "regularHours": {
    "monday": {
      "open": true,
      "open24Hours": false,
      "openTime": "04:30:00",
      "closeTime": "22:00:00"
    },
    "tuesday": {
      "open": true,
      "open24Hours": false,
      "openTime": "04:30:00",
      "closeTime": "22:00:00"
    },
    "wednesday": {
      "open": true,
      "open24Hours": false,
      "openTime": "04:30:00",
      "closeTime": "22:00:00"
    },
    "thursday": {
      "open": true,
      "open24Hours": false,
      "openTime": "04:30:00",
      "closeTime": "22:00:00"
    },
    "friday": {
      "open": true,
      "open24Hours": false,
      "openTime": "04:30:00",
      "closeTime": "22:00:00"
    },
    "saturday": {
      "open": true,
      "open24Hours": false,
      "openTime": "04:30:00",
      "closeTime": "22:00:00"
    },
    "sunday": {
      "open": true,
      "open24Hours": false,
      "openTime": "04:30:00",
      "closeTime": "22:00:00"
    },
    "open24x7": false
  },
  "extendedHours": [],
  "hoursNext7Days": next7Days.map(function (d) {
    return {
      "open": true,
      "open24Hours": false,
      "openTime": "04:30:00",
      "closeTime": "22:00:00",
      "date": d,
      "holidayCode": null
    };
  }),
  "today": {
    "open": false,
    "open24Hours": false,
    "localTime": now,
    "openAsOfLocalTime": true,
    "opensIn": null,
    "closesIn": "5:45:47"
  },
  "serviceTime": null,
  "xopState": 'available',
  "currency": "USD",
  "sdState": null
};