var app = require("./expressServer.js").app;
var blogEngine = require("./blog.js");
var blog = blogEngine.blog;
var fs = require('fs');

var partials = {
	post: fs.readFileSync(__dirname+"/../templates/partials/post.html", 'utf8')
}

app.get("/", function(req, res) {
  res.render("main.html", {
    locals: {
      message: "Hello World!",
      items: ["one", "two", "three"]
    },
  });
});


app.get("/pdf", function(req, res) {
	var url = "http://expressjs.com/guide.html"
  blogEngine.getPDF({
    url: url,
    response: res
    ,css: "#toc {display: none}"
  });
});


app.get("/pdf/:url", function(req, res) {
	var url = req.params.url;
  blogEngine.getPDF({
    url: url,
    response: res
  });
});

app.get("/blog", function(req, res) {
	var options = {pagination: true};
	
  blogEngine.getPosts(blog, function(posts, latest) {
    var renderData = blog;
    renderData.titleLink = req.url;
    renderData.posts = posts;
    res.render("blog.html", {
      locals: renderData,
      partials: partials
    });
  },options);

});

app.get("/blog/more", function(req, res) {
	var options = {pagination: true};
  blogEngine.getPosts(blog, function(posts, latest) {
    var renderData = blog;
    renderData.titleLink = req.url;
    renderData.posts = posts;
    res.render("moreBlog.html", {
      locals: renderData,
      partials: partials
    });
  },options);
});

app.get("/blog/new", function(req, res) {
  var post = {
    title: "New Post",
    text: "Enter some text here …",
    titleLink: req.url
  }

  res.render("post.html", {
    locals: post,
    partials: partials
  });
});

app.get("/blog/category/:category", function(req, res) {
  var category = req.params.category;
  blogEngine.getByCategory(blog, category, function(posts) {
    var page = blog;
    page.title = "An awesome blog";
    page.titleLink = req.url;
    page.posts = posts;

    res.render("blog.html", {
      locals: page,
      partials: partials
    });
  });
});

app.get("/blog/:post", function(req, res) {
  var postName = req.params.post;
  blogEngine.getByTitle(blog, postName, function(post) {
    post.nav = blog.nav;
    post.titleLink = req.url;

    res.render("post.html", {
      locals: post,
      partials: partials
    });
  });
});

app.get("/search", function(req, res) {
  blogEngine.getPosts(blog, function(posts) {
    var page = blog;
    page.title = "An awesome blog";
    page.titleLink = req.url;
    page.posts = posts;

    res.render("blog.html", {
      locals: page,
      partials: partials
    });
  });
});

app.get("/search/:query", function(req, res) {
  var query = req.params.query;
  blogEngine.getBySearch(blog, query, function(posts) {
    var page = blog;
    page.title = "An awesome blog";
    page.titleLink = req.url;
    page.posts = posts;

    res.render("blog.html", {
      locals: page,
      partials: partials
    });
  });
});

app.get("/images/blog/:post/:image", function(req, res) {
  var postID = req.params.post;
  var imageName = req.params.image;
  blogEngine.getImage(postID, imageName, res);
});

app.listen(3002);
