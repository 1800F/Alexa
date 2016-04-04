var fs = require('fs')
  , path = require('path')
  , config = require('../../config')
  , skill = require('../../skill')
  , assert = require('chai').assert
;

describe('end to end',function(){
  this.timeout(1000000);
  itIs('undeliverable-address',function(res){
    assert.include(res.response.outputSpeech.ssml,'cannot be delivered');
  })

  itIs('sunday-undeliverable-date',function(res){
    assert.match(res.response.outputSpeech.ssml,/Would you like to deliver on .*/i);
    assert.equal(res.sessionAttributes.state,'query-date');
  })

  itIs('past-undeliverable-date',function(res){
    assert.match(res.response.outputSpeech.ssml,/Would you like to deliver on .*/i);
    assert.equal(res.sessionAttributes.state,'query-date');
  })

  itIs('sunday-undeliverable-date',function(res){
    assert.match(res.response.outputSpeech.ssml,/Would you like to deliver on .*/i);
    assert.equal(res.sessionAttributes.state,'query-date');
  })

  itIs('past-undeliverable-date',function(res){
    assert.match(res.response.outputSpeech.ssml,/Would you like to deliver on .*/i);
    assert.equal(res.sessionAttributes.state,'query-date');
  })

  function itIs(requestFile, cb) {
    it(requestFile,function(done){
      var event = require('./requests/'+requestFile  + '.js');
      event.session.application.applicationId = config.alexa.appId;
      // TODO Fill in the accessToken with something meaningful
      skill.handler(event, {
        succeed: function(response){
          try{ cb(response); }
          catch(e) { return done (e);}
          done();
        },
        fail: done
      });
    });
  }
});

