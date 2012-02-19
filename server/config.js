exports.db = {
  host: 'localhost',
  port: 5984,
  database: 'gogoblog',
  options: {
    cache: true,
    raw: false
  }
}

exports.imagedir = __dirname + "/files/images/";

//Basic blog template data
exports.blog = {
  title: "An (insignificantly) awesome blog",
  about: "This is a test blog for demonstrating the sheer power that JavaScript posseses.",
  social: [{
    text: "Google+"
  },
  {
    text: "Facebook"
  },
  {
    text: "Twitter"
  },
  {
    text: "LinkedIn"
  },
  {
    text: "Yahoo!"
  }],
  nav: [{
    text: "Home",
    link: "/blog"
  },
  {
    text: "Useless",
    link: "#"
  },
  {
    text: "Pointless",
    link: "#"
  },
  {
    text: "Will not work",
    link: "#"
  }],
  categories: [{
    text: "Articles",
    link: "/blog/category/articles"
  },
  {
    text: "Fun",
    link: "/blog/category/fun"
  },
  {
    text: "Technology",
    link: "/blog/category/tech"
  },
  {
    text: "Typography",
    link: "/blog/category/typography"
  },
  {
    text: "Martial Arts",
    link: "/blog/category/martial-arts"
  }]
}
