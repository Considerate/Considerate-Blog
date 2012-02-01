var app = require("./expressServer.js").app;
var blogEngine = require("./blog.js");
var blog = blogEngine.blog;
var fs = require('fs');
var hashlib = require('hashlib');


var partials = {
  post: fs.readFileSync(__dirname + "/templates/partials/post.html", 'utf8'),
  editpost: fs.readFileSync(__dirname + "/templates/partials/editpost.html", 'utf8'),
  bloglistpost: fs.readFileSync(__dirname + "/templates/partials/bloglistpost.html", 'utf8')
}

function requiresLogin(req, res, next) {
  if (req.session.user) {
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
      res.send(err.message, 401);
      return;
    }
    req.session.user = user;
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

  blogEngine.getPosts(blog, function (posts, latest) {
    var renderData = blog;
    renderData.titleLink = req.url;

    posts.forEach(function (post) {
      post.text = post.shorttext;
    });

    renderData.posts = posts;

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

app.get("/edit/blog/new", requiresLogin, function (req, res) {
  var post = {
    heading: "Create a new post"
  }
  post.originalLink = "/blog";
  
  res.render("editpost.html", {
    locals: post,
    partials: partials
  });
});

app.post("/edit/blog/new", requiresLogin, function (req, res) {
  blogEngine.savePost(blog, {
    newpost: true,
    title: req.body.posttitle,
    markdown: req.body.postbody
  }, function () {
    res.end(JSON.stringify({
      success: true
    }));
  });
});

app.get("/edit/blog/:post", requiresLogin, function (req, res) {
  var postName = req.params.post;
  blogEngine.getByTitle(blog, postName, function (post) {
    post.nav = blog.nav;
    post.titleLink = req.url;
    post.originalLink = "/blog/"+postName;
    post.heading = "Edit post";
    console.log(post);
    res.render("editpost.html", {
      locals: post,
      partials: partials
    });
  });
});

app.post("/edit/blog/:post", requiresLogin, function (req, res) {
  var postName = req.params.post;
  blogEngine.getByTitle(blog, postName, function (post) {
    post.title = req.body.posttitle;
    post.markdown = req.body.postbody;
    console.log(post.markdown);
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

app.post("/blog/image", function (req, res) {
  var imageFile = req.files.image;
  blogEngine.uploadImage(imageFile, function (filename) {
    var result = JSON.stringify({
      filename: filename
    });
    res.end(result);
  });
});

app.get("/blog/category/:category", function (req, res) {
  var category = req.params.category;
  blogEngine.getByCategory(blog, category, function (posts) {
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
  blogEngine.getByAuthor(blog, author, function (posts) {
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
  blogEngine.getByTitle(blog, postName, function (post) {
    post.nav = blog.nav;
    post.titleLink = req.url;
    post.editLink = "/edit"+req.url;

    res.render("post.html", {
      locals: post,
      partials: partials
    });
  });
});

app.get("/search", function (req, res) {
  blogEngine.getPosts(blog, function (posts) {
    var page = blog;
    page.titleLink = req.url;
    page.posts = posts;

    res.render("blog.html", {
      locals: page,
      partials: partials
    });
  });
});

app.get("/search/:query", function (req, res) {
  var query = req.params.query;
  blogEngine.getBySearch(blog, query, function (posts) {
    var page = blog;
    page.titleLink = req.url;
    page.posts = posts;

    res.render("blog.html", {
      locals: page,
      partials: partials
    });
  });
});

app.get("/images/list/blog", function (req, res) {
  blogEngine.getImageList(function (images) {
    res.end(JSON.stringify(images));
  })
});

app.get("/images/blog/:image", function (req, res) {
  var imageName = req.params.image;
  var index = imageName.indexOf("!");
  if (index !== -1) {
    var resolution = imageName.substring(0, index);
    imageName = imageName.substring(index + 1);
    blogEngine.getImage({
      name: imageName,
      resolution: resolution
    }, res);
  }
  else {
    blogEngine.getImage({
      name: imageName
    }, res);
  }
});

app.listen(3002);
