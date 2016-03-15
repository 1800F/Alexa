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
    title: 'Starbucks',
    badPassword: false
  });
});

router.post('/', function (req, res, next) {
  var state = req.body.state,
      username = req.body.username,
      password = req.body.password;

  starbucks.login(username, password).then(function (user) {
    alexaStarbucks.validate(user).then(function (data) {
      if (data.errors.length) {
        res.render('home/account-error', {
          page: 'account-error',
          title: 'Starbucks',
          hasError: function hasError(error) {
            return data.errors.indexOf(error) >= 0;
          }
        });
      } else {
        var paymentMethods = data.paymentMethods.map(function (method) {
          return {
            id: method.paymentMethodId,
            type: (method.paymentType || method.type).toLowerCase(),
            endingIn: method.accountNumberLastFour,
            expirationMonth: method.expirationMonth,
            expirationYear: method.expirationYear,
            isValid: alexaStarbucks.isValidPaymentMethod(method),
            isDefault: !!method.default && !!alexaStarbucks.isValidPaymentMethod(method)
          };
        });
        if (paymentMethods.length == 1 && paymentMethods[0].isValid) paymentMethods[0].isDefault = true;
        var primaryPaymentMethodId = (_.find(paymentMethods, { isDefault: true }) || { id: null }).id;

        res.render('home/request-permission', {
          page: "request-permission",
          title: "Starbucks - Request Permission",
          auth_code: oauthhelper.encryptTokens(user.tokens),
          card: {
            imgUrl: alexaStarbucks.pickCardImage(data.card.imageUrls, 'ImageLarge'),
            name: data.card.nickname
          },
          primaryPaymentMethodId: primaryPaymentMethodId,
          paymentMethods: paymentMethods
        });
      }
    });
  }).catch(function (err) {
    res.render('home/index', {
      page: 'homepage',
      title: 'Starbucks',
      badPassword: true
    });
  });
});

router.post('/oauth', function (req, res, next) {
  var token_expiration = config.starbucks.token_expiration;
  if (!oauthhelper.authenticate(basicauth(req))) return res.sendStatus(403);
  if(verbose) console.log('Grant type:',req.body.grant_type);
  if (req.body.grant_type == 'authorization_code') {
    var tokens = oauthhelper.decryptCode(req.body.code);
    if (token_expiration) tokens.expires_in = token_expiration;
    res.json(tokens);
  } else if (req.body.grant_type == 'refresh_token') {
    starbucks.User({ refresh_token: req.body.refresh_token }).refresh().then(function (tokens) {
      if (token_expiration) tokens.expires_in = token_expiration;
      res.json(tokens);
    }).catch(next);
  } else res.sendStatus(404);
});

router.post('/forgotten-username', function (req, res, next) {
  starbucks.forgotUsername(req.body.email).then(function () {
    res.render('home/forgotten-username-success', {
      page: 'forgotten-username-success',
      title: 'Starbucks',
      email: req.body.email
    });
  }).catch(next);
});

router.get('/no-account', function (req, res, next) {
  res.render('home/no-account', {
    page: "no-account",
    title: "Starbucks - No Account"
  });
});

router.post('/payment-method', function (req, res, next) {
  var tokens = oauthhelper.decryptCode(req.body.auth_code),
      user = starbucks.User(tokens);
  //1) Validate that we got a good payment method
  //2) Set that user token as primary
  //3) Redirect to Alexa success (in an iframe on a success page)
  user.getPrimaryCard(req.body.paymentMethodId).then(function (payment) {
    if (!payment) throw new Error('Unknown payment method');
    return alexaStarbucks.setPaymentMethodId(user, req.body.paymentMethodId);
  }).then(function () {
    return res.render('home/success', {
      page: "success",
      title: "Starbucks - Success",
      redirectUrl: oauthhelper.redirectTo(req.body.state, req.body.auth_code)
    });
  }).catch(function (e) {
    console.error('Something died', e.stack || e);
    next(e);
  });
});

router.get('/privacy-policy', function (req, res, next) {
  res.render('home/privacy-policy', {
    page: "privacy-policy",
    title: "Starbucks - Privacy Policy"
  });
});

router.get('/terms-of-use', function (req, res, next) {
  res.render('home/terms-of-use', {
    page: "terms-of-use",
    title: "Starbucks - Terms of Use"
  });
});

router.get('/forgotten-password', function (req, res, next) {
  res.render('home/forgotten-password', {
    page: "forgotten-password",
    title: "Starbucks - Forgotten Username Success"
  });
});

router.get('forgotten-password-success', function (req, res, next) {
  res.render('home/forgotten-password-success', {
    page: 'forgotten-password-success',
    title: 'Starbucks'
  });
});

router.post('/forgotten-password', function (req, res, next) {
  starbucks.resetPassword(req.body.username, req.body.email).then(function () {
    res.render('home/forgotten-password-success', {
      page: 'forgotten-password-success',
      title: 'Starbucks',
      email: req.body.email,
      username: req.body.username
    });
  }).catch(next);
});

router.get('/forgotten-username', function (req, res, next) {
  res.render('home/forgotten-username', {
    page: "forgotten-username",
    title: "Starbucks - Forgotten Username"
  });
});
