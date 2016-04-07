'use strict';

var assert = require('chai').assert
  , ContactBook = require('../../services/ContactBook.js')
  , Flowers = require('../../services/Flowers.js')
  , _ = require('lodash')
;


var contactBook = ContactBook.fromContacts({}, [
  {firstName: 'Mark', lastName: 'Smith',   id: 1},
  {firstName: 'Mary', lastName: 'Smith', id: 2},
  {firstName: 'Mark', lastName: 'Brown',  id: 3},
  {firstName: 'Daniel', lastName: 'Smith', id: 4},
  {firstName: 'Jen', lastName: 'Alpha',  id: 5},
  {firstName: 'John', lastName: 'Beta',  id: 6}
]);

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

