var Flowers = require('../services/Flowers')
  , config = require('../config')
;

var flowers = Flowers(config.flowers);

flowers.login(config.skill.defaultCredentials.username,config.skill.defaultCredentials.password)
.then(function(user){
  console.log('User',user.tokens);
});
