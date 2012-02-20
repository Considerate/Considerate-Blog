var express = require("express");
var mustache = require("mustache");
var chromeframe = require('express-chromeframe');

var tmpl = {
  compile: function (source, options) {
    if (typeof source == 'string') {
      return function (options) {
        options.locals = options.locals || {};
        options.partials = options.partials || {};
        if (options.body) // for express.js > v1.0
        {
          locals.body = options.body;
        }
        
        var result = mustache.to_html(source, options.locals, options.partials);
        return result;
      };
    } else {
      return source;
    }
  },
  render: function (template, options) {
    template = this.compile(template, options);
    return template(options);
  }
};

var app = express.createServer();

var RedisStore = require('connect-redis')(express);

app.configure(function () {
  app.use(express.session({
    secret: "th30n3andonlypassw0rd",
    store: RedisStore
  }));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  //app.use(app.router);
  app.use(express.static(__dirname + '/../client'));
  app.set("views", __dirname + "/templates");
  app.set("view options", {
    layout: false
  });
  app.register(".html", tmpl);
});

app.configure(function () {
  //app.use(chromeframe());
});


exports.app = app;
