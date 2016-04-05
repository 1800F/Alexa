var Promise = require('bluebird')
  , _ = require('lodash')
  , issue = require('./api-helpers.js').issue
  , moment = require('moment')
  , post = Promise.promisify(require('request').post)
;

var Product = module.exports= function Product(options, productSKU) {
  //options = _.assign({ version: 'alexa/uat/account/v1' }, options);
  options.transform = options.transform || _.identity;

  return options.transform({
    SKU: productSKU,
    details: {},
    getProductDetails: getProductDetails,
    earliestDelivery: getEarliestDeliveryDate,
    getDeliveryCalendar: getDeliveryCalendar,
  }, 'product');

  function getProductDetails() {
    var body = {
     "getProductDetailsRequest": {
        "customerId": "123",
        "customerType": "P",
        "storeId": "20054",
        "siteId": "18F",
        "sourceSystem": "web",
        "brandCode": "1001",
        "productSku": this.SKU,
        "productBase": this.SKU
     }
    };
    return productrequest('POST', '/getProductDetail', {}, body, "product").then(function(details){
      return details.getProductDetailResponse.getProductDetailResult;
    });
  }

  function getEarliestDeliveryDate(zipCode) {
    var body = {
       "getNextAvailDeliveryDateRequest": {
          "customerType": "R",
          "siteId": "18F",
          "sourceSystem": "WEB",
          "skipDateSurchargesFlag": "N",
          "items": {
             "item": {
                "productId": "123",
                "productSku": this.SKU,
                "zipCode": zipCode,
                "locationType": "1",
                "deliveryDate": "",
                "country": "USA",
                "brandCode": "1001"
             }
          }
       }
    };
    return productrequest('POST', '/getEarliestDeliveryDate', {}, body, "product");
  }

  function getDeliveryCalendar(zipCode, startDate, specificDate) {
    startDate = !startDate ? '' : moment(startDate).format("DD-MMM-YY").toUpperCase();
    specificDate = !specificDate ? '' : moment(specificDate).format("DD-MMM-YY").toUpperCase();

    var body = {
     "getDlvrCalRequest": {
        "country": "USA",
        "deliveryDate": specificDate,
        "locationType": "1",
        "productSku": this.SKU,
        "siteId": "18F",
        "sourceSystem": "web",
        "startDate": startDate,
        "zipCode": zipCode,
        "brandCode": "1001"
     }
    };

    return productrequest('POST', '/getDeliveryCalendar', {}, body, "product");

  }

  function productrequest(method, path, queryString, body, apiType) {
    if (queryString && queryString.giveResponse) {
      var giveResponse = true;
      delete queryString.giveResponse;
    }
    return issue(method, null, path, queryString, body, options, apiType).then(function (res) {
      if (res.statusCode < 200 || res.statusCode >= 300) return Promise.reject(res);
      if (res.statusCode == 201 && !res.body) res.body = {};
      if (giveResponse) res.body.response = res;
      return res.body;
    });
  }
};
