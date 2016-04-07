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
;

exports.choices = [
	{
		'name': 'Mothers Day'
		, 'sku': '146638'
		, 'description': "The Mother's Day arrangement features light pink roses, pink Oriental, Hybrid, and Peruvian lilies, carnations, white snapdragons, pink stock, and salal tips. It is artistically designed in an eight-inch-tall, pink, vintage-inspired glass vase."
		, 'sizes': [
			{
				'name': 'small'
				, 'suffix': 'S'
				, 'description': "The small, 13-stem Mother's Day arrangement is about 17 inches high, including the eight-inch pink vase. And it's about 14 inches in diameter."
			}
			, {
				'name': 'medium'
				, 'suffix': 'M'
				, 'description': "The medium Mother's Day arrangement stands about 18 inches high, including the eight-inch pink vase. And it's about 16 inches in diameter."
			}
			, {
				'name': 'large'
				, 'suffix': 'L'
				, 'description': "The 20-stem large Mother's Day arrangement stands about 19 inches high, including the eight-inch pink vase. It's roughly 18 inches in diameter."
			}
		]
	}
	, {
		'name': 'Birthday'
		, 'sku': '91333'
		, 'description': "The \"birtday arrangement\" features hot-pink roses, purple carnations, hot-pink mini carnations, yellow daisy poms, purple alstroemeria, athos poms, solidago and salal, all gathered in a stylish, 8-inch glass vase tied with colorful ribbon. It comes with an 18-inch Mylar birthday balloon."
		, 'sizes': [
			{
				'name': 'small'
				, 'suffix': 'SHB'
				, 'description': "The small 11-stem \"birthday arrangement\" is about 14 inches high, including the stylish eight inch glass vase. It's about 10 inches in diameter."
			}
			, {
				'name': 'medium'
				, 'suffix': 'MHB'
				, 'description': "The 15-stem medium birthday arrangement is about 15 inches high, including the stylish, eight-inch vase, and it's about 11.5 inches in diameter."
			}
			, {
				'name': 'large'
				, 'suffix': 'LHB'
				, 'description': "The large birthday arrangement has 18 stems and is about 16 inches high, including the stylish, eight-inch vase. It's roughly 13 inches in diameter."
			}
		]
	}
	, {
		'name': 'Love and Romance'
		, 'sku': '90950'
		, 'description': "The \"love and romance\" bouquet has gorgeous red and pink roses, lilies, <phoneme alphabet=\"ipa\" ph=\"ˈgɝ.bɝ.əˌ\">Gerbera</phoneme> daisies and alstroemeria, in an eight-inch glass vase tied with <phoneme alphabet=\"ipa\" ph=\"ˈsa.tinˌ\">satin</phoneme> ribbon."
		, 'sizes': [
			{
				'name': 'small'
				, 'suffix': 'S'
				, 'description': "The 12-stem small \"Love and <phoneme alphabet=\"ipa\" ph=\"ˈɹoʊ.mæns\">romance</phoneme>\" arrangement is about 17 inches high, including the eight-inch vase. And it's about 13 inches in diameter."
			}
			, {
				'name': 'medium'
				, 'suffix': 'M'
				, 'description': "The medium \"Love and <phoneme alphabet=\"ipa\" ph=\"ˈɹoʊ.mæns\">romance</phoneme>\" arrangement has 16 stems. It's about 19 inches high, including the eight-inch vase. And it's roughly 14 inches in diameter."
			}
			, {
				'name': 'large'
				, 'suffix': 'L'
				, 'description': "The large \"Love and <phoneme alphabet=\"ipa\" ph=\"ˈɹoʊ.mæns\">romance</phoneme>\" arrangement has 20 stems and is about 20 inches high, including the eight-inch vase. And it's about 16 inches in diameter."
			}
		]
	}
	, {
		'name': 'Thank You'
		, 'sku': '100299'
		, 'description': "The colorful \"Thank you\" bouquet is the next best thing to a friendly hug! It is crafted by our expert florists from the hot-pink roses, Asiatic lilies, medium sunflowers, lavender stock, orange alstroemeria and athos poms in a classic cylinder vase."
		, 'sizes': [
			{
				'name': 'small'
				, 'suffix': 'S'
				, 'description': "The small, 18-stem \"Thank You\" arrangement is about 11 inches high, including the cylindrical six-inch tall vase. It is about 11 inches in diameter."
			}
			, {
				'name': 'medium'
				, 'suffix': 'M'
				, 'description': "The medium \"Thank You\" arrangement is about 12 inches high, including the cylindrical, six-inch-tall vase. It has 21 stems and is about 12 inches in diameter."
			}
			, {
				'name': 'large'
				, 'suffix': 'L'
				, 'description': "The large 25-stem \"Thank You\" arrangement is about 13 inches high, including the elegant, six-inch-tall vase. It is about 13 inches in diameter."
			}
		]

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
