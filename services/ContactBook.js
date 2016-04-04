var _ = require('lodash')
  , natural = require('natural')
  , metaphone = natural.Metaphone
;

/*
 *  { cont_id: '460145807930351379',
 *     demoGraphicsID: '698145927190945348',
 *     FirstName: 'Mark',
 *     LastName: 'Stevenett',
 *     AddressType: 'Residence',
 *     NickName: '686 E 110 S|Suite 102||AMERICAN FORK|UT|84003|US'
 *  }
 */

function ContactBook(api) {
  _.assign(this,api);
}

function fromContacts(api,contacts) {
  var book = new ContactBook(api);
  book.build(contacts);
  return book;
}
exports.fromContacts = fromContacts;

function fromData(api,data) {
  var book = new ContactBook(api);
  _.assign(book,data);
  return book;
}

exports.fromData = fromData;

ContactBook.prototype.build = function(contacts){
  this.contacts = _(contacts)
    .map(function(contact){
      return {
        id: contact.cont_id,
        demoId: contact.demoGraphicsID,
        firstName: contact.FirstName,
        lastName: contact.LastName,
        address: contact.NickName // Insanely, the API stores addresses in the Nickname field
      };
    })
    .groupBy('firstName')   
    .map(function(contacts,name){   
      return {    
        name: name,   
        contacts: contacts    
      };    
    })    
    .sortBy('name')   
    .value();
}

ContactBook.prototype.serialize = function(){
  return _.omit(this,['user','flowers','analytics']);
}

ContactBook.prototype.hasContacts = function() {
  return !!this.contacts.length;
}

ContactBook.prototype.range = function(offset, take) {
  return _.slice(this.contacts,offset,offset+take);
}

ContactBook.prototype.searchByName = function(name) {
  return _(this.contacts)
    .filter(function(contact) {
      return (metaphone.compare(contact.name, name));
    });
}
