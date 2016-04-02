var fs = require('fs')
  , path = require('path')
  , config = require('../../config')
  , skill = require('../../skill')
  , assert = require('chai').assert
;

describe('end to end',function(){
  itIs('undeliverable-address',function(res){
    assert.include(res.response.outputSpeech.ssml,'cannot be delivered');
  })

  function itIs(requestFile, cb) {
    it(requestFile,function(done){
      var event = require('./requests/'+requestFile  + '.json');
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

