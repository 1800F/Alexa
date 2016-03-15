/* Copyright (C) Crossborders LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Greg Hedges <gregh@rain.agency>, January 2016
 */
'use strict';
var _ = require('lodash')
;

var translations = {
  'venti': 'vɛnti',
  'grande': 'grɔndeɪ',
  'misto': 'mis̺t̪o',
  'mondul': 'mɔn ˌdɔːl',
  'uganda': 'juːˈɡɑːndə',
  "ka'u": "kah OO",
  "da lat": "dɑː'lɑːt",
  "papua new guinea ulya": "pæpuə njuː ˈɡɪni ulia",
  "sertaozinho": "ser-tão-zi-nho"
}

exports.replace = function(str) {
  return _.reduce(_.keys(translations),function(str, orig){
    var ipa = translations[orig];
    return str.replace(new RegExp(orig,'ig'),
                       '<phoneme alphabet="ipa" ph="' + ipa +'">' + orig + '</phoneme>'
                      );
  },str)
}

/*
Venti > Ven-tee
Grande > Gron-day
Crème (not sure she is saying this right)
Créme (is this different than above?)
Misto > Meesto
Mondul (not sure she is saying this right)
Uganda (pretty sure she is saying this right)
Sipi (not sure she is saying this right)
Ka'u (not sure she is saying this right)
Da Lat (not sure she is saying this right)
Papua New Guinea Ulya (not sure she is saying this right)
Sertaozinho (pretty sure she is saying this right)
Caffé (is this right?)


Slot Types Words Where Adjustments Were needed that could affect pronunciation.
Crème
Créme
Caffé
Café
Brulée
nariño
perú
*/
