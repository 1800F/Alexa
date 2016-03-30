'use strict';

var assert = require('chai').assert,
    ContactBook = require('../../services/ContactBook.js'),
    Flowers = require('../../services/Flowers.js'),
    _ = require('lodash');

describe('ContactBook', function () {
  describe('searcyByName', function () {
    var contactBook = ContactBook.fromData({},{contacts: [
      {name: 'mark', contacts: [{id: 1}]},
      {name: 'marc', contacts: [{id: 2},{id: 3}]},
      {name: 'jen', contacts: [{id: 4},{id: 5}]},
      {name: 'jake', contacts: [{id: 6},{id: 7}]},
      {name: 'john', contacts: [{id: 8},{id: 9}]},
      {name: 'jon', contacts: [{id: 10},{id: 11}]},
    ]});



    itIs('mark',[1,2,3])
    itIs('marc',[1,2,3])
    itIs('MARC',[1,2,3])
    itIs('jen',[4,5,8,9,10,11])
    itIs('jon',[4,5,8,9,10,11])
    itIs('john',[4,5,8,9,10,11])
    itIs('mitchell',[])

    function itIs(name,ids) {
      it(name + ' => ' + ids.join(','),function(){
        var actual = _.map(contactBook.searchByName(name),'id');
        assert.sameMembers(actual,ids);
      })
    }
  });
});
