'use strict';

/**
 * Module dependencies.
 */


var express = require('express'),
    bodyParser = require('body-parser'),
    serveStatic = require('serve-static'),
    morgan = require('morgan'),
    http = require('http'),
    path = require('path'),
    config = require('../config'),
    routes = require('./routes'),
    env = require('../config/env.js')
    ;

console.log('Attempting to start.\r\n\t'
            + 'Node version: '
            + process.version
            + '\r\n\tNODE_ENV: '
            + env);
var app = express();

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://ask-ifr-download.s3.amazonaws.com");
  req.header('Access-Control-Allow-Methods', 'GET');
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.use(serveStatic(path.join(__dirname, 'public')));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(routes.router);

var server = http.createServer(app);
server.listen(config.server.port, function () {
  console.log('Server listening on port %d.', config.server.port);
});
