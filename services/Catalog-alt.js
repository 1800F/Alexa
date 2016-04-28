/**
 * Copyright (C) Crossborders LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * An object to manage the catalog of arrangement's and size's descriptions.
 *
 * Written by Christijan Draper <christijand@rain.agency>, March 2016
 * Reviewed by Christian Torres <christiant@rain.agency>, March 2016
 */
'use strict';

var _ = require('lodash')
  , config = require('../config')
;

exports.choices = [
  {
    'name': 'Mother\'s Day'
    , 'sku': (config.flowers.endpoint === "https://ecommerce.800-flowers.net/alexa/uat" ? '90950' : '144754')
    , 'description': "The Mother's Day arrangement features pink, orange and yellow roses gathered with exotic Peruvian lilies. These fresh-picked flowers are shipped overnight in a gift box to ensure freshness. They arrive in bud form and will open to full bloom in 3 to 4 days to provide lasting beauty. Actual bloom color may vary."
    , 'sizes': [
      {
        'name': 'small'
        , 'suffix': 'S'
        , 'description': "The small Mother's Day arrangement consists of 16-stems and it's about 18 inches in diameter."
      }
      , {
        'name': 'medium'
        , 'suffix': 'M'
        , 'description': "The medium, 16-stem Mother's Day arrangement is identical to the small arrangement, but it also comes with a 8-inch tall pink vase."
      }
      , {
        'name': 'large'
        , 'suffix': 'MPV4'
        , 'description': "The large Mother's Day arrangement contains 'twice as many' stems as the small and medium options. This 32-stem arrangement includes a seven-and-a-half inch textured, pink glass vase."
      }
    ]
  }
  , {
    'name': 'Birthday'
    , 'sku': (config.flowers.endpoint === "https://ecommerce.800-flowers.net/alexa/uat" ? '90950' : '107308')
    , 'description': "The \"birthday arrangement\" features a kaleidoscope of classic roses, petite spray roses, cheery <phoneme alphabet=\"ipa\" ph=\"ˈgɝ.bɝ.əˌ\">Gerbera</phoneme> daisies and exotic Fuji mums. These fresh-picked flowers are shipped overnight in a gift box to ensure freshness. They arrive in bud form and will open to full bloom in 3 to 4 days to provide lasting beauty."
    , 'sizes': [
      {
        'name': 'small'
        , 'suffix': (config.flowers.endpoint === "https://ecommerce.800-flowers.net/alexa/uat" ? 'S' : 'S')
        , 'description': "The small \"birthday arrangement\" is half the size of the medium and large arrangements. It comes in a gift box, without a vase."
      }
      , {
        'name': 'medium'
        , 'suffix': (config.flowers.endpoint === "https://ecommerce.800-flowers.net/alexa/uat" ? 'M' : 'SSMV2')
        , 'description': "The medium \"birthday arrangement\" is the same bouquet as the small arrangement, but comes with an 8-inch, “Lotsa Happy Wishes” vase, featuring embossed daisies and inspirational words. This vase was designed exclusively by inspirational artist and author Sandra Magsamen."
      }
      , {
        'name': 'large'
        , 'suffix': (config.flowers.endpoint === "https://ecommerce.800-flowers.net/alexa/uat" ? 'L' : 'MGV9')
        , 'description': "The large \"birthday arrangement\" has twice the stems as the small and medium arrangements. It comes with a green, 7.75 inch fluted glass ginger jar vase."
      }
    ]
  }
  , {
    'name': 'Love and Romance'
    , 'sku': '90926'
    , 'description': "The \"love and romance\" bouquet has two dozen gorgeous red roses. These fresh-picked flowers are shipped overnight in a gift box to ensure freshness. They arrive budding to provide lasting beauty and enjoyment."
    , 'sizes': [
      {
        'name': 'small'
        , 'suffix': 'M'
        , 'description': "The small \"Love and <phoneme alphabet=\"ipa\" ph=\"ˈɹoʊ.mæns\">romance</phoneme>\" arrangement consists of two dozen red roses. A vase is not included."
      }
      , {
        'name': 'medium'
        , 'suffix': 'MRDV3'
        , 'description': "The medium \"Love and <phoneme alphabet=\"ipa\" ph=\"ˈɹoʊ.mæns\">romance</phoneme>\" arrangement also has 24 stems, but comes with an 8.75-inch red vase."
      }
      , {
        'name': 'large'
        , 'suffix': 'MSLV2'
        , 'description': "The large \"Love and <phoneme alphabet=\"ipa\" ph=\"ˈɹoʊ.mæns\">romance</phoneme>\" arrangement has 24 stems and includes an 8.25-inch shimmering ceramic silver embossed vase with a romantic rose design."
      }
    ]
  }
  , {
    'name': 'Thank You'
    , 'sku': '90577'
    , 'description': "The colorful \"Thank you\" bouquet showcases our freshest multicolored tulips. These fresh-picked flowers are shipped overnight in a gift box to ensure freshness. They arrive in bud form and will open to full bloom in 3 to 4 days to provide lasting beauty. Actual bloom color may vary."
    , 'sizes': [
      {
        'name': 'small'
        , 'suffix': 'S'
        , 'description': "The small \"Thank You\" arrangement has 15 stems of beautiful multicolored tulips. It does not come with a vase."
      }
      , {
        'name': 'medium'
        , 'suffix': 'SPUV3'
        , 'description': "The medium \"Thank You\" arrangement also has 15 stems and comes with a 7.75-inch, ribbed, purple, 'ginger jar' vase."
      }
      , {
        'name': 'large'
        , 'suffix': 'MPUV3'
        , 'description': "The large \"Thank You\" arrangement has 30 stems – twice the number of the small and medium arrangements. It also comes with a 7.75-inch, purple, ribbed, 'ginger jar' vase."
      }
    ]
  }
];

exports.findByName = function(name) {
  return _(exports.choices)
    .find(function(entry){
      return entry.name.toLowerCase() == name.toLowerCase();
    });
}

exports.indexByName = function(name) {
  return _(exports.choices)
    .map(function(entry) {
      return entry.name.toLowerCase();
    })
    .indexOf(name.toLowerCase());
}
