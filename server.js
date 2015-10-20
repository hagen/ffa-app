// BASE SETUP
// =============================================================================
// DEBUG=*,-not_this
// call the packages we need
// Load up environment variables
var env = require('node-env-file');
env(__dirname + '/.env');

// Express
var express = require('express'); // call express
var app = express(); // define our app using express

var passport = require('passport');

var port = process.env.PORT || 80; // set our port
var mongoose = require('mongoose');
var session = require('express-session');

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// required for passport
app.use(session({ secret : process.env.SESSION_SECRET || 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session());

// routing
require('./app/routes')(app, passport);

// Serve up static app files; this is not required for mobile packaging
app.use(express.static(process.env.DIRECTORY));

// SDK is always hosted outside of the app directory, and incorporated with
// a virtual path for serving to the app
app.use('/sdk', express.static('../sdk'));

// =============================================================================
// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
