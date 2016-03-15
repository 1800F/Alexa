"use strict";

module.exports = {
  "paging": {
    "total": 4,
    "offset": 1,
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
        commerce: { sku: 108517 },
        product: { productType: 11 },
        childItems: []
      }, {
        quantity: 2,
        commerce: { sku: 20 },
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