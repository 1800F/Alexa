"use strict";

module.exports = {
  "paging": {
    "total": 3,
    "offset": 0,
    "limit": 10,
    "returned": 3
  },
  "orderHistoryItems": [{
    inStoreOrder: {
      storeNumber: '14026-108060'
    },
    basket: {
      items: [{
        quantity: 1,
        commerce: { sku: 108517 }, //Seasonal
        product: { productType: 11 },
        childItems: []
      }]
    }
  }, {
    inStoreOrder: {
      storeNumber: '17912-136436'
    },
    basket: {
      items: [{
        quantity: 1,
        commerce: { sku: 41 },
        product: { productType: 11 },
        childItems: []
      }]
    }
  }, {
    inStoreOrder: {
      storeNumber: '19282-181688'
    },
    basket: {
      items: [{
        quantity: 1,
        commerce: { sku: 41 },
        product: { productType: 11 },
        childItems: []
      }]
    }
  }]
};