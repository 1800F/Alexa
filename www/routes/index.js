'use strict';

var router = exports.router = require('../infrastructure/mount.js')(__dirname),
    config = require('../../config/'),
    Flowers = require('../../services/Flowers.js'),
    flowers = Flowers(config.flowers),
    OAuthHelpers = require('../../services/oauth-helpers.js'),
    oauthhelper = OAuthHelpers(config.alexa.auth),
    NewCrypto = require('../../services/newCrypto.js'),
    newCrypto = NewCrypto(config.flowers),
    url = require('url'),
    basicauth = require('basic-auth'),
    alexaFlowers = require('../../services/alexa-flowers.js'),
    _ = require('lodash'),
    verbose = config.verbose,
    lang = require('../../skill/lang.js')
    ;

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
      console.log('--------------------------------------------------------------------VALIDATE DATA---------------------------------');
      console.log(data);
      var authCode = oauthhelper.encryptTokens({"systemID":data.systemID, "customerID":data.customerID});
      res.render( data.noCC || data.noContacts || data.noBillingAddress ?'home/success-needs-more' :'home/success'
      , {
        page: "success",
        title: "1800flowers - Account Linked",
        auth_code: authCode,
        redirectUrl: oauthhelper.redirectTo(req.body.state, authCode),
        nextSteps: lang.enumerate(_.compact([
            data.noCC ? 'contacts' : ''
          , data.noBillingAddress ? 'a billing address' : ''
          , data.noContacts ? 'contacts' : ''
        ])),
        created: false
      });
    }).catch(function (err) {
      console.error(err.stack);
      res.render('home/index', {
        page: 'homepage',
        title: '1800flowers',
        badPassword: true
      });
    })
  }).catch(function (err) {
    console.error(err.stack || err);
    res.render('home/index', {
      page: 'homepage',
      title: '1800flowers',
      badPassword: true
    });
  });
});

router.post('/oauth', function (req, res, next) {
  console.log("OAUTH POSTED");
  console.log(req.body);
  // var token_expiration = config.flowers.token_expiration;
  //if (!oauthhelper.authenticate(basicauth(req))) return res.sendStatus(403);
  if(verbose) console.log('Grant type:',req.body.grant_type);
  if (req.body.grant_type == 'authorization_code') {
    var tokens = oauthhelper.decryptCode(req.body.code);
    // if (token_expiration) tokens.expires_in = token_expiration;
    //res.json(tokens);
    res.json({"access_token":req.body.code, "token_type": "bearer", "state": req.body.state });
  } else if (req.body.grant_type == 'refresh_token') {
    //starbucks.User({ refresh_token: req.body.refresh_token }).refresh().then(function (tokens) {
      // if (token_expiration) tokens.expires_in = token_expiration;
      var tokens = oauthhelper.decryptCode(req.body.code);
      //res.json(tokens);
      res.json({"access_token":req.body.code, "token_type": "bearer", "state": req.body.state });
  } else res.sendStatus(404);
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
    console.log('Create User:' + user.registerNewCustomerResponse.customerData.customerID);
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
      flowers.addCustomerDetails(first, lastname, email, user.registerNewCustomerResponse.customerData.systemID).then(function (details) {
        if (details.AddPersonResponse) {
          console.log(details.AddPersonResponse.result.person);
          var authCode = oauthhelper.encryptTokens({"systemID": user.registerNewCustomerResponse.customerData.systemID, "customerID": details.AddPersonResponse.result.person.idPK});
          res.render('home/success-needs-more', {
              page: "success",
              title: "1800flowers - Account Created",
              auth_code: authCode,
              redirectUrl: oauthhelper.redirectTo(req.body.state, authCode),
              nextSteps: lang.enumerate(_.compact([
                'contacts'
                , 'a billing address'
                , 'contacts'
              ])),
              created: true
          });
        }
      }).catch(function (err) {
        console.log("Error adding customer details " + JSON.stringify(err));
        res.render('home/create', {
          page: 'create',
          title: '1800flowers',
          errorCreating: true,
          errorMessage: "We were unabled to set your profile, please review your email address and other information and try again."
        });
      });
    }
  }).catch(function (err) {
    console.log("Error Creating User: " + JSON.stringify(err));
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
    user.submitOrder({productSku:"90950L", prodType:"FPT", itemPrice:"69.99"},
    {firstName:"Mark", lastName:"Miles", address:{addr1:"test"}},
    {firstName:"Mark", lastName:"Miles", addr1:"686 E State St", addr2:"Suite 101", city:"American Fork", state:"UT", postalCode:"84003", country:"USA"},
    {number:"4333"},
    {shortDate:"14-APR-16"}).then(function(order) {
      console.log(order);
    })
  });

  //TEST PRODUCT API
  //var floralEmbrace = Flowers.Product(config.flowers, "91333SHB");
  // floralEmbrace.getProductDetails().then(function (details) {
  //   console.log("PRODUCT DETAILS: " + JSON.stringify(details));
  //   floralEmbrace.details = details;
    // floralEmbrace.getDeliveryCalendar("84660", "03-31-2016", "04-02-2016" ).then(function (calendar) {
    //   console.log("DELIVERY CALENDAR: " + JSON.stringify(calendar));
    // });
  //   floralEmbrace.earliestDelivery("L", "84003").then(function (delivery) {
  //     console.log("Earliest delivery: " + JSON.stringify(delivery));
  //   });
 // });

  //TEST PURCHASE API
  // var purchase = Flowers.Purchase(config.flowers);
  // purchase.login().then(function (tokens) {
    //console.log("AUTH TOKENS CCAUTH---------------" + JSON.stringify(tokens.access_token));
    // var cc = newCrypto.encryptCreditCard("4455121235351234");
    // console.log("CC ENCRYPTED: " + cc);
    // purchase.tokenizeCC(cc, tokens.access_token).then(function (tokenized) {
    //   console.log("Tokenize FINISHED: " + tokenized);
    // });
    // purchase.authorizeCC(tokens.access_token).then(function (authorized) {
    //   console.log("Authorize CC FINISHED: " + authorized);
    // });
  // });
  // console.log("------------------------------GETTING SHIPPING------------------------------")
  // purchase.getShipping({productSku:"90950L", prodType:"FPT", itemPrice:"69.99"},
  //   {firstName:"Mark", lastName:"Miles", addr1:"686 E State St", addr2:"Suite 101", city:"American Fork", state:"UT", postalCode:"84003", country:"USA"},
  //   {shortDate:"14-APR-16"}).then(function(shipping) {
  //     console.log("--------Shipping: " + JSON.stringify(shipping));
  // });

  // purchase.getTaxes("90950L", "84660", "69.99", "14.99").then(function (taxes) {
  //   if (taxes.error) {
  //     console.log("Error getting taxes: " + taxes.error);
  //   } else {
  //     console.log("Taxes: " + taxes);
  //   }
  // });

  // purchase.getOrderNumber().then(function (orderNum) {
  //   if (orderNum.error) {
  //     console.log("Error getting order number: " + orderNum.error);
  //   }
  //   else
  //     console.log("ORDER NUMBER RECEIVED: " + orderNum);
  // });

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
