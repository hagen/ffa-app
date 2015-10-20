var braintree = require('braintree');
var secrets = require('../../config/secrets.js');

var gateway = braintree.connect({
  environment : braintree.Environment.Sandbox,
  merchantId : secrets.braintree.merchantId,
  publicKey : secrets.braintree.publicKey,
  privateKey : secrets.braintree.privateKey
});

module.exports = function(app, passport) {
  // middleware specific to this router
  app.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
  });

  // Request client token to begin payment (auth via. Bearer only)
  app.get('/payments/token', passport.authenticate('bearer', {
    session: false
  }), function(req, res) {
    gateway.clientToken.generate({}, function (err, response) {
      res.json({ clientToken : response.clientToken });
    });
  });

  // Create a customer in Braintree (basic)
  app.post('/payments/customer', passport.authenticate('bearer', {
    session : false
  }), function(req, res) {
    gateway.customer.create({ customFields : { profile_id : req.body.profileId } }, function(err, result) {
      if(err) {
        res.json({ status : "Error", payload : err });
      } else {
        // Otherwise, return the new client Id
        debugger;
        res.json({ status : "Success", customerId : result.customer.id });
      }
    });
  });

  // Process lite subscription
  app.post("/payments/lite", function (req, res) {
    processPayment(req, res, 'lite');
  });

  // Process pro subscription
  app.post("/payments/pro", function (req, res) {
    processPayment(req, res, 'pro');
  });

  // Process lite subscription
  app.post("/payments/upgrade/free", function (req, res) {
    cancelSubscription(req, res);
  });

  // Process lite subscription
  app.post("/payments/upgrade/lite", function (req, res) {
    upgradeSubscription(req, res, 'lite');
  });

  // Process pro subscription
  app.post("/payments/upgrade/pro", function (req, res) {
    upgradeSubscription(req, res, 'pro');
  });
}

function cancelSubscription(req, res) {
  var subscriptionId = req.body.subscriptionId;

  gateway.subscription.cancel(subscriptionId, function(error, result) {
    if(error) {
      res.json({
        status : 'Error',
        payload : error
      });
    } else {
      res.json({
        status : 'Success',
        payload : result
      });
    }
  });
};

function upgradeSubscription(req, res, plan) {
  var subscriptionId = req.body.subscriptionId;

  gateway.subscription.update(subscriptionId, {
    planId : plan,
    options : {
      prorateCharges : true
    }
  }, function(error, result) {
    if(error) {
      res.json({
        status : 'Error',
        payload : error
      });
    } else {
      res.json({
        status : 'Success',
        payload : result
      });
    }
  });
};

function processPayment(req, res, plan) {
  var nonce = req.body.payment_method_nonce;
  var customerId = req.body.customerId;

  debugger;
  // Create payment method first, with included billing data.
  gateway.paymentMethod.create({
    customerId : customerId,
    paymentMethodNonce : nonce,
    billingAddress : {
      firstName : req.body.firstName,
      lastName : req.body.lastName,
      company : req.body.company,
      streetAddress : req.body.streetAddress,
      extendedAddress : req.body.extendedAddress,
      region : req.body.region,
      postalCode : req.body.postalCode,
      countryCodeAlpha2 : req.body.countryCodeAlpha2
    }
  }, function(err, result) {
    if(err) {
      res.json({ status : "Error", payload : err });
      return;
    }

    // The payment method token is returned to us
    var token = result.paymentMethod.token;
    debugger;
    // Now I have a payment method Id, and can use this for the subscription
    gateway.subscription.create({
      paymentMethodToken : token,
      planId : plan
    }, function(err, result) {
      debugger;
      if(err) {
        res.json({ status : "Error", error : err });
        return;
      }

      if(result.errors) {
        res.json({ status : "Error", error : result.errors });
        return;
      }

      // And now I have a subscription status!
      res.json({ status : "Success", subscription : result.subscription });
    });
  });
}
