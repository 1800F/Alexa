'use strict';

var router = exports.router = require('../infrastructure/mount.js')(__dirname),
    config = require('../../config/'),
    Flowers = require('../../services/Flowers.js'),
    flowers = Flowers(config.starbucks),
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

router.post('/', function (req, res, next) {
  var state = req.body.state,
      username = req.body.email,
      password = req.body.password;

  process.stdout.write(username + ": " + password + "\r");

  flowers.login(username, password).then(function (user) {
    alexaStarbucks.validate(user).then(function (data) {
      if (data.errors.length) {
        res.render('home/account-error', {
          page: 'account-error',
          title: '1800flowers',
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
          title: "1800flowers - Request Permission",
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
    process.stdout.write("Error logging in: " + err + "\r");
    res.render('home/index', {
      page: 'homepage',
      title: '1800flowers',
      badPassword: true
    });
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
