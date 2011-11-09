var express = require("express");
var mustache = require("mustache");
var chromeframe = require('express-chromeframe');

var tmpl = {
  compile: function(source, options) {
    if (typeof source == 'string') {
      return function(options) {
        options.locals = options.locals || {};
        options.partials = options.partials || {};
        if (options.body) // for express.js > v1.0
        {
          locals.body = options.body;
        }
        return mustache.to_html(
        source, options.locals, options.partials);
      };
    } else {
      return source;
    }
  },
  render: function(template, options) {
    template = this.compile(template, options);
    return template(options);
  }
};

var app = express.createServer();

app.configure(function() {
  app.use(chromeframe());
});

app.configure(function() {
  app.use(app.router);
  app.use(express.static(__dirname + '/..'));
  app.set("views", __dirname + "/../templates");
  app.set("view options", {
    layout: false
  });
  app.register(".html", tmpl);
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

exports.app = app;
