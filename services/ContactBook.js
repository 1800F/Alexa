var _ = require('lodash');

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
      return _.pick(contact,'FirstName','LastName','cont_id');
    })
    .groupBy('FirstName')
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
