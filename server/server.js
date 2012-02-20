var app = require("./expressServer.js").app;
var blogEngine = require("./blog.js");
var blog = blogEngine.blog;
var fs = require('fs');
var hashlib = require('hashlib');


var partials = {
  post: fs.readFileSync(__dirname + "/templates/partials/post.html", 'utf8'),
  editpost: fs.readFileSync(__dirname + "/templates/partials/editpost.html", 'utf8'),
  bloglistpost: fs.readFileSync(__dirname + "/templates/partials/bloglistpost.html", 'utf8'),
  editbar: fs.readFileSync(__dirname + "/templates/partials/editbar.html", 'utf8')
}

function requiresLogin(req, res, next) {
  console.log(req.sessionStore);
  console.log(req.session);
  console.log(req.session.user);
  if (req.session.user) {
    console.log(req.session.user);
    next();
  } else {
    res.redirect('/login/redir/' + req.url);
  }
}

app.get('/login', function (req, res) {
  if (req.session && req.session.user) {
    res.redirect('/blog');
    return;
  }
  res.render('login.html', {
    locals: {
      redir: ""
    }
  });
});

app.get('/login/redir/*', function (req, res) {
  if (req.session && req.session.user) {
    res.redirect(req.params[0]);
    return;
  }
  res.render('login.html', {
    locals: {
      redir: req.params[0]
    }
  });
});

app.post('/login', function (req, res) {
  var pass = hashlib.sha1(req.body.password);
  blogEngine.authenticate(req.body.user, pass, function (err, user) {
    if (err) {
      console.log(err);
      res.send(err.message, 401);
      return;
    }
    req.session.user = user;
    console.log(req.session.user);
    if (req.body.redir) {
      res.redirect(req.body.redir);
    }
    else {
      res.redirect("/blog");
    }
  });
});

app.get('/logout', function (req, res) {
  req.session.user = null;
  res.redirect('/login');
});


app.get("/", function (req, res) {
  res.render("main.html", {
    locals: {
      message: "Hello World!",
      items: ["one", "two", "three"]
    },
  });
});


app.get("/pdf", function (req, res) {
  var url = "http://expressjs.com/guide.html"
  blogEngine.getPDF({
    url: url,
    response: res,
    css: "#toc {display: none}"
  });
});


app.get("/pdf/:url", function (req, res) {
  var url = req.params.url;
  blogEngine.getPDF({
    url: url,
    response: res
  });
});

app.get("/blog", function (req, res) {
  var options = {
    descending: true
    //pagination: true
  };

  if(req.session.user) {
    if(req.session.user.admin === true) {
      options.isAdmin = true;
    }
    options.sessionUser = req.session.user;
  }
  blogEngine.getPosts(blog, function (posts, latest) {
    var renderData = blog;
    renderData.titleLink = req.url;

    posts.forEach(function (post) {
      if (post) {
        post.text = post.shorttext;
        if(post.type === "unapproved post") {
          post.unapproved = "unapproved";
        }
      }
    });

    renderData.posts = posts;
    
    if(req.session.user) {
      renderData.editbar = {
        add:true
      };
    }

    res.render("blog.html", {
      locals: renderData,
      partials: partials
    });
  }, options);

});

app.get("/blog/more", function (req, res) {
  var options = {
    pagination: true
  };
  if(req.session.user) {
    if(req.session.user.admin === true) {
      options.isAdmin = true;
    }
    options.sessionUser = req.session.user;
  }
  blogEngine.getPosts(blog, function (posts, latest) {
    var renderData = blog;
    renderData.titleLink = req.url;
    renderData.posts = posts;
    res.render("moreBlog.html", {
      locals: renderData,
      partials: partials
    });
  }, options);
});

app.get("/blog/edit/new", requiresLogin, function (req, res) {
  var post = {
    heading: "Create a new post"
  }
  post.originalLink = "/blog";
  post.editbar = {
    stopedit: true
  };

  res.render("editpost.html", {
    locals: post,
    partials: partials
  });
});

app.post("/blog/edit/new", requiresLogin, function (req, res) {
  blogEngine.savePost(blog, {
    author: req.session.user.name,
    newpost: true,
    title: req.body.posttitle,
    markdown: req.body.postbody,
    poster: req.body.poster
  }, function () {
    res.end(JSON.stringify({
      success: true
    }));
  });
});

app.get("/blog/edit/:post", requiresLogin, function (req, res) {
  var postName = req.params.post;
  var options = {};
  if(req.session.user) {
    if(req.session.user.admin === true) {
      options.isAdmin = true;
    }
    options.sessionUser = req.session.user;
  }
  blogEngine.getByTitle(blog, postName, options,function (post) {
    post.nav = blog.nav;
    post.titleLink = req.url;
    post.originalLink = "/blog/" + postName;
    post.editbar = {
     stopedit: true 
    }
    post.heading = "Edit post";
    res.render("editpost.html", {
      locals: post,
      partials: partials
    });
  });
});

app.post("/blog/edit/:post", requiresLogin, function (req, res) {
  var postName = req.params.post;
  var options = {};
   if(req.session.user) {
     if(req.session.user.admin === true) {
       options.isAdmin = true;
     }
     options.sessionUser = req.session.user;
   }
  blogEngine.getByTitle(blog, postName, options,function (post) {
    post.title = req.body.posttitle;
    post.markdown = req.body.postbody;
    post.author = req.session.user.name;
    post.user = req.session.user;
    post.poster = req.body.poster;
    blogEngine.savePost(blog, post, function () {
      res.end(JSON.stringify({
        success: true
      }));
    });
  });
});

app.post("/blog/preview", requiresLogin, function (req, res) {
  res.header("Content-Type", "text/html");
  var result = blogEngine.convertMarkdownToHTML(req.body.data);
  res.end(result);
});

app.get("/blog/images/list", function (req, res) {
  var username = req.session.user._id;
  blogEngine.getImageList(username, function (images) {
    var result = [];
    images.forEach(function (image) {
      result.push({
        filename: image,
        user: username
      });
    })
    res.end(JSON.stringify(result));
  })
});

app.get("/blog/images/poster/:user/:image", function (req, res) {
  var imageName = req.params.image;
  var user = req.params.user;
  var index = imageName.indexOf("!");
  if (index !== -1) {
    var resolution = imageName.substring(0, index);
    imageName = imageName.substring(index + 1);
    blogEngine.getImage({
      name: imageName,
      user: user,
      resolution: resolution,
      poster: true
    }, res);
  }
  else {
    blogEngine.getImage({
      user: user,
      name: imageName,
      poster: true
    }, res);
  }
});

app.get("/blog/images/:user/:image", function (req, res) {
  var imageName = req.params.image;
  var user = req.params.user;
  var index = imageName.indexOf("!");
  if (index !== -1) {
    var resolution = imageName.substring(0, index);
    imageName = imageName.substring(index + 1);
    blogEngine.getImage({
      name: imageName,
      user: user,
      resolution: resolution
    }, res);
  }
  else {
    blogEngine.getImage({
      user: user,
      name: imageName
    }, res);
  }
});

app.post("/blog/image", requiresLogin, function (req, res) {
  var imageFile = req.files.image;
  var user = req.session.user._id;
  blogEngine.uploadImage(user, imageFile, function (filename) {
    var result = JSON.stringify({
      filename: filename
    });
    res.end(result);
  });
});

app.get("/blog/category/:category", function (req, res) {
  var category = req.params.category;
  var options = {};
   if(req.session.user) {
     if(req.session.user.admin === true) {
       options.isAdmin = true;
     }
     options.sessionUser = req.session.user;
   }
  blogEngine.getByCategory(blog, category, options, function (posts) {
    var page = blog;
    page.titleLink = req.url;
    page.posts = posts;

    res.render("blog.html", {
      locals: page,
      partials: partials
    });
  });
});

app.get("/blog/author/:author", function (req, res) {
  var author = req.params.author;
  var options = {};
   if(req.session.user) {
     if(req.session.user.admin === true) {
       options.isAdmin = true;
     }
     options.sessionUser = req.session.user;
   }
  blogEngine.getByAuthor(blog, author, options,function (posts) {
    var page = blog;
    page.titleLink = req.url;
    page.posts = posts;

    res.render("blog.html", {
      locals: page,
      partials: partials
    });
  });
});

app.get("/blog/search", function (req, res) {
  var options = {};
   if(req.session.user) {
     if(req.session.user.admin === true) {
       options.isAdmin = true;
     }
     options.sessionUser = req.session.user;
   }
  blogEngine.getPosts(blog, options, function (posts) {
    var page = blog;
    page.titleLink = req.url;
    page.posts = posts;

    res.render("blog.html", {
      locals: page,
      partials: partials
    });
  });
});

app.get("/blog/search/:query", function (req, res) {
  var query = req.params.query;
  var options = {};
   if(req.session.user) {
     if(req.session.user.admin === true) {
       options.isAdmin = true;
     }
     options.sessionUser = req.session.user;
   }
  blogEngine.getBySearch(blog, query, options, function (posts) {
    var page = blog;
    page.titleLink = req.url;
    page.posts = posts;

    res.render("blog.html", {
      locals: page,
      partials: partials
    });
  });
});

app.get("/blog/:post", function (req, res) {
  var postName = req.params.post;
  var options = {};
   if(req.session.user) {
     if(req.session.user.admin === true) {
       options.isAdmin = true;
     }
     options.sessionUser = req.session.user;
   }
  blogEngine.getByTitle(blog, postName, options, function (post) {
    post.nav = blog.nav;
    post.titleLink = req.url;
    post.editLink = "/blog/edit/" + postName;
    if(req.session.user) {
      post.editbar = {
        edit: true
      };
      if(req.session.user.admin === true) {
        if(post.type === "unapproved post") {
          post.editbar.approve = true;
        }
        else {
          post.editbar.unapprove = true;
        }
      }
    }

    res.render("post.html", {
      locals: post,
      partials: partials
    });
  });
});


var port = process.env.PORT || 80;
app.listen(port, function () {
  console.log("Listening on " + port);
}); 
