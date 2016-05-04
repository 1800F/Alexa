var OAuthHelpers = require('../services/oauth-helpers.js')
  , config = require('../config')
  , oauthhelper = OAuthHelpers(config.alexa.auth)
  , accessToken = "GlfkP8rLePYj+8EUEcbwrTlKr9Ym8ScxBJeBoaZ+OjdHNWo9DFMkq93CKrlp/w9bYGGvcLu4yqx5S5gZg6VUPuigg1RmVaJpcRCikzX8zdXgJk35aTsoNRJZQ/Yb1uFznDw68T2n9yyiV+H/kj0Pf+6171m43KaaONOj9hPV5AVUHdn6QUcik6UwwF8AojWqsxQcS3pOpUMy2B9SKYs8ATAk"
;

var tokens = oauthhelper.decryptCode(accessToken);

console.log(tokens);
