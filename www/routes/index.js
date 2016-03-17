'use strict';

var router = exports.router = require('../infrastructure/mount.js')(__dirname),
    config = require('../../config/'),
    Starbucks = require('../../services/Starbucks.js'),
    starbucks = Starbucks(config.starbucks),
    OAuthHelpers = require('../../services/oauth-helpers.js'),
    oauthhelper = OAuthHelpers(config.alexa.auth),
    url = require('url'),
    basicauth = require('basic-auth'),
    alexaStarbucks = require('../../services/alexa-starbucks.js'),
    _ = require('lodash'),
    verbose = config.verbose;

router.get('/fail', function (req, res, next) {
  res.redirect(oauthhelper.redirectTo(req.query.state, 'notvalid'));
});

// Commutes session data around in query strings. This is so we can keep track of tokens passed to us by Amazon
router.use(function (req, res, next) {
  var pieces = ['state', 'client_id', 'response_type', 'auth_code'];
  pieces.forEach(function (piece) {
    var parsed = (req.query ? req.query[piece] : null) || (req.body ? req.body[piece] : null);
    res.locals[piece] = parsed;
  });

  res.locals.url = function (uri) {
    var _this = this;

    var uri = url.parse(uri, true);
    delete uri.search;
    pieces.forEach(function (piece) {
      return uri.query[piece] = _this[piece];
    });
    return url.format(uri);
  };
  res.locals.trackingCode = config.googleAnalytics.trackingCode;
  next();
});

router.get('/', function (req, res, next) {
  res.render('home/index', {
    page: 'homepage',
    title: '1800flowers',
    badPassword: false
  });
});

router.get('/no-account', function (req, res, next) {
  res.render('home/no-account', {
    page: "no-account",
    title: "1800flowers - No Account"
  });
});

router.get('/create', function (req, res, next) {
  res.render('home/create', {
    page: "account-required",
    title: "1800flowers - Account Required"
  });
});

router.get('/success', function (req, res, next) {
  res.render('home/success', {
    page: "success",
    title: "1800flowers - Success"
  });
});

router.get('/account-required', function (req, res, next) {
  res.render('home/account-required', {
    page: "create",
    title: "1800flowers - Create Account"
  });
});

router.get('/privacy-policy', function (req, res, next) {
  res.render('home/privacy-policy', {
    page: "privacy-policy",
    title: "1800flowers - Privacy Policy"
  });
});

router.get('/terms-of-use', function (req, res, next) {
  res.render('home/terms-of-use', {
    page: "terms-of-use",
    title: "1800flowers - Terms of Use"
  });
});

router.get('/forgotten-password', function (req, res, next) {
  res.render('home/forgotten-password', {
    page: "forgotten-password",
    title: "1800flowers - Forgotten Username Success"
  });
});

router.get('forgotten-password-success', function (req, res, next) {
  res.render('home/forgotten-password-success', {
    page: 'forgotten-password-success',
    title: '1800flowers'
  });
});
