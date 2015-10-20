// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    accessToken      : String,
    linkToken        : String,
    local            : {
        email        : String,
        password     : String,
        firstname    : String,
        lastname     : String
    },
    linkedin         : {
        id           : String,
        token        : String,
        email        : String,
        firstname    : String,
        lastname     : String,
        headline     : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }

});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password, next) {
    bcrypt.hash(password, bcrypt.genSaltSync(8), null, next);
};

// checking if password is valid
userSchema.methods.validPassword = function(password, next) {
    bcrypt.compare(password, this.local.password, next);
};

// Remember Me implementation helper method
userSchema.methods.generateRandomToken = function () {
  var user = this,
      chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      token = new Date().getTime() + '_';
  for ( var x = 0; x < 16; x++ ) {
    var i = Math.floor( Math.random() * 62 );
    token += chars.charAt( i );
  }
  return token;
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
