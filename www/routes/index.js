'use strict';

var router = exports.router = require('../infrastructure/mount.js')(__dirname),
    config = require('../../config/'),
    Flowers = require('../../services/Flowers.js'),
    flowers = Flowers(config.flowers),
    OAuthHelpers = require('../../services/oauth-helpers.js'),
    oauthhelper = OAuthHelpers(config.alexa.auth),
    url = require('url'),
    basicauth = require('basic-auth'),
    alexaFlowers = require('../../services/alexa-flowers.js'),
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
    alexaFlowers.validate(user).then(function (data) {
      if (data.errors.length) {
        res.render('home/account-error', {
          page: 'account-error',
          title: '1800flowers',
          hasError: function hasError(error) {
            return data.errors.indexOf(error) >= 0;
          }
        });
      } else {
        var authCode = oauthhelper.encryptTokens({"systemID":data.systemID, "customerID":data.customerID});
        process.stdout.write('auth_code: ' + authCode + "\r");
        if (data.noCC || data.noContacts) {
          res.render('home/success-needs-more', {
            page: "success",
            title: "1800flowers - Account Linked",
            auth_code: authCode,
            noCC: data.noCC,
            noContacts: data.noContacts,
            created: false
            // card: {
            //   imgUrl: alexaFlowers.pickCardImage(data.card.imageUrls, 'ImageLarge'),
            //   name: data.card.nickname
            // }
          });
        }
        else {
          res.render('home/success', {
            page: "success",
            title: "1800flowers - Account Linked",
            auth_code: authCode,
            noCC: data.noCC,
            noContacts: data.noContacts,
            created: false
            // card: {
            //   imgUrl: alexaFlowers.pickCardImage(data.card.imageUrls, 'ImageLarge'),
            //   name: data.card.nickname
            // }
          });
        }
      }
    }).catch(function (err) {
      console.log("ERROR AUTHENTICATING----------------------------------------******************************----------------------:");
      console.log(err);
      res.render('home/index', {
        page: 'homepage',
        title: '1800flowers',
        badPassword: true
      });
    })
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
    title: "1800flowers - Account Required",
    errorCreating: false,
    errorMessage: ""
  });
});

router.post('/create', function (req, res, next) {
  var first = req.body.firstname,
    lastname = req.body.lastname,
    email = req.body.email,
    password = req.body.password,
    confirm = req.body.confirmpassword,
    state = req.body.state;

  flowers.createCustomer(email, password).then(function (user) {
    process.stdout.write('Create User: ' + user.registerNewCustomerResponse.customerData.customerID + "\r");
      if (user.registerNewCustomerResponse.error.errorCode) {
        console.log("ERROR CODE EXISTS: " + user.registerNewCustomerResponse.error.errorCode);
        res.render('home/create', {
          page: 'account-error',
          title: '1800flowers',
          errorCreating: true,
          errorMessage: user.registerNewCustomerResponse.error.errorDetails
        });
      } else {
        console.log("ERROR CODE DOESN'T EXIST");
        var authCode = oauthhelper.encryptTokens({"systemID": user.registerNewCustomerResponse.customerData.systemID});
        res.render('home/success-needs-more', {
            page: "success",
            title: "1800flowers - Account Created",
            auth_code: authCode,
            noCC: true,
            noContacts: true,
            created: true
        });
        // flowers.login(email, password).then(function (flowersUser) {
        //   flowersUser.getProfile(user.registerNewCustomerResponse.customerData.systemID).then( function (userProfile) {
        //     console.log("System ID: " + user.registerNewCustomerResponse.customerData.systemID);
        //     console.log("Customer ID: " + userProfile.Get18FCustomerByAdminSysKeyResponse.result.response.idPK);
        //     var authCode = oauthhelper.encryptTokens({"systemID":user.registerNewCustomerResponse.customerData.systemID, "customerID":userProfile.Get18FCustomerByAdminSysKeyResponse.result.response.idPK});
        //     res.render('home/success-needs-more', {
        //         page: "success",
        //         title: "1800flowers - Account Created",
        //         auth_code: authCode,
        //         noCC: true,
        //         noContacts: true,
        //         created: true
        //     });
        //   }).catch(function (profileError) {
        //     console.log("PROFILE ERROR: ", profileError);
        //       res.render('home/create', {
        //       page: 'create',
        //       title: '1800flowers',
        //       errorCreating: true,
        //       errorMessage: profileError
        //     });
        //   });
        // });
      }
  }).catch(function (err) {
    process.stdout.write("Error Creating User: " + err + "\r");
    res.render('home/create', {
      page: 'create',
      title: '1800flowers',
      errorCreating: true,
      errorMessage: err
    });
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
  //TEST ORDER
  flowers.login('1stevenh@rain.agency', '1rainPssword').then(function (user) {
    console.log(user);
    user.submitOrder().then(function(order) {
      console.log(order);
    })
  });


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
