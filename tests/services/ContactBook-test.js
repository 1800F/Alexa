'use strict';

var assert = require('chai').assert
  , ContactBook = require('../../services/ContactBook.js')
  , Flowers = require('../../services/Flowers.js')
  , _ = require('lodash')
;


var contactBook = ContactBook.fromData({}, {contacts: [
  {firstName: 'Mark', lastName: 'Smith',  firstPhonetic: 'MRK', lastPhonetic: 'SM0', id: 1},
  {firstName: 'Mary', lastName: 'Smith', firstPhonetic: 'MR', lastPhonetic: 'SM0', id: 2},
  {firstName: 'Mark', lastName: 'Brown', firstPhonetic: 'MRK', lastPhonetic: 'BRN', id: 3},
  {firstName: 'Daniel', lastName: 'Smith', firstPhonetic: 'TNL', lastPhonetic: 'SM0', id: 4},
  {firstName: 'Jen', lastName: 'Alpha',  firstPhonetic: 'JN', lastPhonetic: 'ALF', id: 5},
  {firstName: 'John', lastName: 'Beta',  firstPhonetic: 'JN', lastPhonetic: 'BT', id: 6}
]});

itIs('mark', [1,3]);
itIs('Smith', [1,2,4]);
itIs('brown', [3]);
itIs('mary', [2]);
itIs('marc', [1,3]);
itIs('DANIEL', [4]);
itIs('Mark Smith', [1]);
itIs('Jen Alpha', [5]);
itIs('Michael', []);
itIs('Jen', [5,6]); // unfortunately there are some false positives

function itIs(name,ids) {
  it(name + ' => ' + ids.join(','),function(){
    var actual = _.map(contactBook.searchByName(name),'id');
    assert.sameMembers(actual,ids);
  });
}

