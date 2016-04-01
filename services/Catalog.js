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

exports.choices = [
	{
		'name': 'Mothers Day'
		, 'sku': '146638'
		, 'description': "This delicate bouquet, features light pink roses, pink Oriental, Hybrid, and Peruvian lilies, carnations, white snapdragons, pink stock, and salal tips. It is artistically designed in an eight-inch-tall, pink, vintage-inspired glass vase."
		, 'sizes': [
			{
				'name': 'small'
				, 'suffix': 'S'
				, 'description': "The small, 13-stem, Mother's Day arrangement is about 17 inches high, including the eight-inch pink vase, and it is about 14 inches in diameter. This arrangement includes one hybrid lily, four pink carnations, and two white snapdragons, with three pink alstroemeria and three salal tips."
			}
			, {
				'name': 'medium'
				, 'suffix': 'M'
				, 'description': "The lovely medium Mother's Day arrangement stands about 18 inches high, including the eight-inch pink vase, and it is about 16 inches in diameter. This arrangement includes one Oriental lily, three pink roses, three white snapdragons, two pink stock, three pink alstroemeria and three salal tips, for a total of 15 stems."
			}
			, {
				'name': 'large'
				, 'suffix': 'L'
				, 'description': "The beautiful 20-stem large Mother's Day arrangement stands about 19 inches high, including the eight-inch pink vase. It is about 18 inches in diameter. This arrangement includes two Oriental lilies, five pink roses, three white snapdragons, three pink stock, four pink alstroemeria and three salal tips."
			}
		]
	}
	, {
		'name': 'Birthday'
		, 'sku': '91333'
		, 'description': "This hand-crafted arrangement features hot-pink roses, purple carnations, hot-pink mini carnations, yellow daisy poms, purple alstroemeria, athos poms, solidago and salal, all gathered in a stylish, 8-inch glass vase tied with colorful ribbon. It comes with an 18-inch Mylar birthday balloon."
		, 'sizes': [
			{
				'name': 'small'
				, 'suffix': 'SHB'
				, 'description': "The small arrangement is about 14 inches high, including the eight-inch vase, and it is about 10 inches in diameter."
			}
			, {
				'name': 'medium'
				, 'suffix': 'MHB'
				, 'description': "The medium arrangement is about 15 inches high, including the eight-inch vase, and it is about 11.5 inches in diameter."
			}
			, {
				'name': 'large'
				, 'suffix': 'LHB'
				, 'description': "The large arrangement is about 16 inches high, including the eight-inch vase, and it is about 13 inches in diameter."
			}
		]
	}
	, {
		'name': 'Love and Romance'
		, 'sku': '90950'
		, 'description': "This field-gathered bouquet has gorgeous red and pink roses, lilies, <phoneme alphabet=\"ipa\" ph=\"ˈgɝ.bɝ.əˌ\">Gerbera</phoneme> daisies and alstroemeria, in an eight-inch glass vase tied with <phoneme alphabet=\"ipa\" ph=\"ˈsa.tinˌ\">satin</phoneme> ribbon."
		, 'sizes': [
			{
				'name': 'small'
				, 'suffix': 'S'
				, 'description': "The small arrangement is about 17 inches high, including the eight-inch vase, and it is about 13 inches in diameter."
			}
			, {
				'name': 'medium'
				, 'suffix': 'M'
				, 'description': "The medium arrangement is about 19 inches high, including the eight-inch vase, and it is about 14 inches in diameter."
			}
			, {
				'name': 'large'
				, 'suffix': 'L'
				, 'description': "The large arrangement is about 20 inches high, including the eight-inch vase, and it is about 16 inches in diameter."
			}
		]
	}
	, {
		'name': 'Thank You'
		, 'sku': '100299'
		, 'description': "This colorful bouquet is the next best thing to a friendly hug! It is crafted by our expert florists from the hot-pink roses, Asiatic lilies, medium sunflowers, lavender stock, orange alstroemeria and athos poms in a classic cylinder vase."
		, 'sizes': [
			{
				'name': 'small'
				, 'suffix': 'S'
				, 'description': "The small arrangement is about 11 inches high, including the eight-inch vase, and it is about 11 inches in diameter."
			}
			, {
				'name': 'medium'
				, 'suffix': 'M'
				, 'description': "The medium arrangement is about 12 inches high, including the eight-inch vase, and it is about 12 inches in diameter."
			}
			, {
				'name': 'large'
				, 'suffix': 'L'
				, 'description': "The large arrangement is about 13 inches high, including the eight-inch vase, and it is about 13 inches in diameter."
			}
		]
	}
];

exports.sizesByArrangement = function(arrangement) {

}
