var dateFormat = require('dateformat');
var cradle = require('cradle');
var db = new(cradle.Connection)('http://considerate.couchone.com', 80, {
  cache: true,
  raw: false
}).database('blogdemo');
var fs = require('fs');
var temp = require('temp');
var uuid = require('node-uuid');
var path = require("path");
var ghm = require("github-flavored-markdown");

// Print all of the news items on hackernews
var jsdom = require('jsdom');

var im = require("imagemagick");

/**
 * Get all posts
 */

var last_key = {};
var last_id = null;


var authenticate = function (login, password, callback) {

  db.view('blog/users', {
    key: login
  }, function (err, view) {
    var doc = view[0].value;
    if (err) {
      callback(new Error(require("util").inspect(err)));
      return;
    }
    var error;
    if (doc === null) {
      error = new Error("document not found");
      callback(error);
      return;
    }
    if (doc.password === password) {
      //Login successful
      callback(null, doc);
      return;
    }
    else {
      error = new Error("passwords does not match");
      callback(error);
    }
    console.dir(doc);
  });
};

function savePost(blog, post, callback) {
  if (post.newpost === true) {
    delete post.newpost;
    post.created = new Date().toISOString();
    db.save(post, function (err, res) {
      callback();
    });
  }
  else {
    var id = post._id;
    delete post.newpost;
    db.save(post._id, post._rev, post, function (err, res) {
      callback();
    });
  }
}

function getPosts(blog, callback, options) {
  options = defaultOptions(options);

  db.view("blog/all", options, function (err, res) {
    var posts = [];
    //console.log(res);
    res.forEach(function (key, post, id) {
      post = handlePost(post);
      posts.push(post);

      last_key = key;
      last_id = id;
    });
    getLatest(blog, function (latest) {
      blog.latest = latest;
      callback(posts, latest);
    });
  });
}

function defaultOptions(options) {
  var skip = 1;
  options = options || {
    descending: true
  };
  var limit = options.limit || 2;
  if (last_id === null) {
    skip = 0;
  }
  if (options.pagination === true) {
    options = {
      startkey: last_key,
      startkey_docid: last_id,
      skip: skip,
      limit: limit,
      descending: true
    };
  }

  return options;
}

function handlePost(post) {
  var post, images, image_data;

  images = [];
  var date = new Date(post.created);
  post.date = dateFormat(date, "yyyy-mm-dd HH:MM");

  //Generate image URLs
/*
  for (var index in row._attachments) {
    if (row._attachments.hasOwnProperty(index)) {
      image_data = row._attachments[index];
      images.push({
        imageId: index,
        content_type: image_data.content_type,
        src: "/images/blog/" + row._id + "/" + index
      });
    }
  }*/
  post.text = convertMarkdownToHTML(post.markdown);

  var doc = jsdom.jsdom("<html><body>" + post.text + "</body></html>");
  var window = doc.createWindow();
  var plainText = window.document.body.textContent;
  if (plainText.length > 300) {
    var index = plainText.indexOf(".", 300);
    if (index === -1) {
      //retain full plain text
    } else {
      plainText = plainText.substring(0, index + 1);
    }
  }
  post.shorttext = plainText;

  post.slug = generateSlug(post.title);
  post.categoryLink = "/blog/category/" + generateSlug(post.category);
  if (post.author) {
    post.authorLink = "/blog/author/" + generateSlug(post.author);
  }
  return post;
}

/**
 * Get post by title
 */

function getByTitle(blog, title, callback) {
  var last_key = {};
  var last_id = null;
  var title = generateSlug(title);
  var options = defaultOptions();
  options.startkey = [title,
  {}];
  options.endkey = [title, 0];

  db.view("blog/title", options, function (err, res) {
    var post = res[0].value;
    post = handlePost(post);
    callback(post);
  });
}

/**
 * Get posts by author
 */

function getByAuthor(blog, author, callback) {
  var last_key = {};
  var last_id = null;
  var author = generateSlug(author);
  var options = defaultOptions();
  options.startkey = [author,
  {}];
  options.endkey = [author, 0];

  db.view("blog/author", options, function (err, res) {
    console.log(res);
    var posts = [];
    res.forEach(function (key, post, id) {
      post = handlePost(post);
      posts.push(post);
    });
    callback(posts);
  });
}



/**
 * Get posts with title matching search criteria
 */

function getBySearch(blog, searchQuery, callback) {
  var last_key = {};
  var last_id = null;
  var options = {
    descending: true
  };
  searchQuery = generateSlug(searchQuery);
  getPosts(blog, function (posts) {
    var result = posts.filter(function (item) {
      //Filter out all not matching search query
      return (item.slug.match(searchQuery) || item.text.match(searchQuery, "i"));
    });
    callback(result);
  }, options);
}


/**
 * Get posts with category name
 */

function getByCategory(blog, category, callback) {
  category = generateSlug(category);

  var last_key = {};
  var last_id = null;
  var options = defaultOptions();
  options.startkey = [category,
  {}];
  options.endkey = [category, 0];

  db.view("blog/category", options, function (err, res) {
    if (err) throw JSON.stringify(err);
    var posts = [];
    res.forEach(function (key, post, id) {
      post = handlePost(post);
      posts.push(post);
    });
    callback(posts);
  });
}

/**
 * Get the latest posts
 */

function getLatest(blog, callback) {
  db.view("blog/datesort", {
    descending: true,
    limit: 5
  }, function (err, res) {
    var latest;
    latest = [];
    res.forEach(function (row) {
      latest.push({
        link: "/blog/" + generateSlug(row.title),
        text: row.title
      });
    });
    callback(latest);
  });
}

function generateSlug(string) {
  var slug;
  slug = string.replace(/[^a-zA-Z0-9]+/g, '-');
  slug = slug.toLowerCase();
  return slug;
}


/**
 * Get an image from the database
 */
/*
function getImage(docId,imageId,out) {
	var streamer;
	streamer = db.getAttachment(docId,imageId);
  streamer.addListener('data', function (chunk) { 
	  out.write(chunk, "binary");
  });
  streamer.addListener('end', function () {
    out.end()
  });
}*/

function getImage(options, res) {
  if (options.resolution) {


    var pathdir = __dirname + "/files/images";
    var originalpath = pathdir + "/" + options.name;
    var filepath = pathdir + "/" + options.resolution + "!" + options.name;

    im.readMetadata(originalpath, function (err, metadata) {
      if (err) throw err
      var reso = options.resolution;
      var resX = Number(reso.substring(0, reso.indexOf("x")));
      var resY = Number(reso.substring(reso.indexOf("x" + 1)));

      if (metadata && metadata.exif && resX >= metadata.exif.exifImageLength && resY > metadata.exif.exifImageWidth) {
        res.sendfile(originalpath);
      }
      else {
        path.exists(filepath, function (exists) {
          if (exists) {
            res.sendfile(filepath);
          }
          else {
            im.convert([originalpath, '-resize', options.resolution + ">", filepath], function (err, stdout) {
              if (err) throw err;
              res.sendfile(filepath);
            });
          }
        });
      }
    });


  } else {
    var pathdir = __dirname + "/files/images";
    var filepath = pathdir + "/" + options.name;
    res.sendfile(filepath);
  }
}

function getImageList(callback) {
  var pathdir = __dirname + "/files/images";
  fs.readdir(pathdir, function (err, files) {
    if (err) throw err;

    var images = files.filter(function (name) {
      return name.indexOf(".") !== 0 && name.indexOf("!") === -1;
    });
    callback(images);
  })
}

function uploadImage(imageFile, callback) {
  var pathdir = __dirname + "/files/images";
  var id = uuid.v4();
  console.log(imageFile.filename);
  var filename = id + path.extname(imageFile.filename);
  var filepath = pathdir + "/" + filename;
  fs.rename(imageFile.path, filepath, function (err) {
    if (err) throw err;
    console.log("File " + filepath + " uploaded");
    callback(filename, filepath, id)
  });
}

function getPDF(options) {
  if (options.css) {
    temp.open('pdfCss', function (err, info) {
      fs.write(info.fd, options.css);
      fs.close(info.fd);
      options.cssFile = info.path;
      delete options.css;
      getPDF(options);
    });
  }
  else {
    var cssFileName = options.cssFile || __dirname + "/../stylesheets/pdf.css";
    // Generate PDF constructor
    var PDF = require("node-wkhtml").pdf({
      'margin-top': 0,
      'margin-bottom': 0,
      'margin-left': 0,
      'margin-right': 0,
      'dpi': 300,
      "user-style-sheet": cssFileName
    });

    temp.open('pdf', function (err, info) {
      fs.write(info.fd, options.css);
      fs.close(info.fd);
      var filename = info.path;
      var pdf = new PDF(options);
      pdf.convertAs(filename, function (err, stdout) {
        getPDFFile(filename, options.response);
      });
    });
  }
}


function getPDFFile(filename, response) {
  var inp;

  response.writeHead(200, {
    'Content-Type': 'application/pdf'
  });
  inp = fs.createReadStream(filename);
  inp.setEncoding('binary');
  inp.on('data', function (data) {
    response.write(data, "binary");
  });
  inp.on('end', function (close) {
    response.end();
  });
  inp.on('error', function (error) {
    console.log('FS-Error: ' + error);
    response.end();
  });
  inp.on('close', function (close) {
    response.end();
  });
}


//Basic blog template data
var blog = {
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


function convertMarkdownToHTML(markdown, allowedTags, allowedAttributes, forceProtocol) {
  markdown = stripUnwantedHTML(markdown, allowedTags, allowedAttributes, forceProtocol);
  markdown = handleCustomTags(markdown);
  markdown = ghm.parse(markdown);
  markdown = handleMarkdownTables(markdown);
  return markdown;


  //From coappcms

  function handleCustomTags(markdown) {
    // handle my custom video inserts
    // %[webmurl]
    markdown = markdown.replace(/%\[\s*(.*)\s*]/gi, function (p0, p1, p2, p3) {
      var videourlmp4 = "";
      var videourlwebm = p1;
      var imageurl = "";

      return '\n<div class="embeddedvideo">\n<video width="100%" height="100%" poster="' + imageurl + '" controls="controls" style="width:100%; height:100%; background: black;">' + '    <source type="video/webm" src="' + videourlwebm + '" />' + '</video>\n</div>\n';
      //'    <source type="video/mp4" src="' + videourlmp4 + '" />' + 
      //'    <object width="' + 640 + '" height="' + 480 + '" type="application/x-shockwave-flash" data="/scripts/flashmediaelement.swf">' + 
      //'        <param name="movie" value="/scripts/flashmediaelement.swf" />' + 
      //'        <param name="flashvars" value="controls=true&file=' + videourlmp4 + '" />' +
      //'        <img src="' + imageurl + '" width="' + 640 + '" height="' + 480 + '" title="No video playback capabilities" />' + //Image as a last resort 
      //'    </object>' +
    });

    // %[webmurl,posterimageurl,mp4url]
    markdown = markdown.replace(/%\[\s*(.*)\s*,?\s*(.*)\s*,?\s*(.*)\s*]/gi, function (p0, p1, p2, p3) {
      var videourlmp4 = p3;
      var videourlwebm = p1;
      var imageurl = p2;

      return '\n<div class="embeddedvideo">\n<video width="100%" height="100%" poster="' + imageurl + '" controls="controls" preload="none" style="width:100%; height:100%;">' + '    <source type="video/mp4" src="' + videourlmp4 + '" />' + '    <source type="video/webm" src="' + videourlwebm + '" />' + '    <object width="' + 640 + '" height="' + 480 + '" type="application/x-shockwave-flash" data="/scripts/flashmediaelement.swf">' + '        <param name="movie" value="/scripts/flashmediaelement.swf" />' + '        <param name="flashvars" value="controls=true&file=' + videourlmp4 + '" />' + '        <img src="' + imageurl + '" width="' + 640 + '" height="' + 480 + '" title="No video playback capabilities" />' + //Image as a last resort 
      '    </object>' + '</video>\n</div>\n';
    });

    return markdown;
  }

  function handleMarkdownTables(markdown) {
    // handle my table formatter (after regular markdown)
    // |header1|header2|header3|
    // |row1text1|row1text3|row1text3|
    // <p>|Variable|Description|<br />|${apps}|coapp root directory (typically <code>c:\apps</code>)|</p>
    markdown = markdown.replace(/<p>(\|.*\|)<\/p>/g, function (match1, table) {
      table = table.replace(/\|<br \/>\|/g, "|\n|");
      var rows = table.split("\n");
      var result = '';
      // first row is always the header
      result += '<p>\n    <table class="zebra-striped condensed-table" style="width:;" ><thead><tr>';
      var cells = rows[0].split('|');
      for (var c = 0; c < cells.length; c++) {
        result += '<th>{0}</th>'.Format(cells[c]);
      }
      result += "</tr></thead>\n    <tbody>";

      for (var i = 1; i < rows.length; i++) {
        result += '    <tr>';
        cells = rows[i].split('|');
        for (c = 0; c < cells.length; c++) {
          result += '<td>{0}</td>'.Format(cells[c]);
        }
        result += '</tr>\n';
      }

      result += "    </tbody></table>\n</p>";
      return result;
    });

    return markdown;
  }

  //From node-markdown
  /**
   * stripUnwantedHTML(html, allowedtags, allowedAttribs, forceProtocol) -> String
   * - html (String): HTML code to be parsed
   * - allowedTags (String): allowed HTML tags in the form of "tag1|tag2|tag3"
   * - allowedAttributes (Object): allowed attributes for specific tags
   *   format: {"tag1":"attrib1|attrib2|attrib3", "tag2":...}
   *   wildcard for all tags: "*"
   * - forceProtocol (Boolean): Force src and href to http:// if they miss a protocol.
   * 
   * Removes unwanted tags and attributes from HTML string
   **/

  function stripUnwantedHTML(html /*, allowedTags, allowedAttributes, forceProtocol */ ) {
    var allowedTags = arguments[1] || 'a|b|blockquote|code|del|dd|dl|dt|em|h1|h2|h3|i|img|li|ol|p|pre|sup|sub|strong|strike|ul|br|hr|iframe',
        allowedAttributes = arguments[2] || {
        'img': 'src|width|height|alt',
        'a': 'href',
        '*': 'title'
        },
        forceProtocol = arguments[3] || false;

    testAllowed = new RegExp('^(' + allowedTags.toLowerCase() + ')$'), findTags = /<(\/?)\s*([\w:\-]+)([^>]*)>/g, findAttribs = /(\s*)([\w:-]+)\s*=\s*(?:(?:(["'])([^\3]+?)(?:\3))|([^\s]+))/g;

    // convert all strings patterns into regexp objects (if not already converted)
    for (var i in allowedAttributes) {
      if (allowedAttributes.hasOwnProperty(i) && typeof allowedAttributes[i] === 'string') {
        allowedAttributes[i] = new RegExp('^(' + allowedAttributes[i].toLowerCase() + ')$');
      }
    }

    // find and match html tags
    return html.replace(findTags, function (original, lslash, tag, params) {
      var tagAttr, wildcardAttr, rslash = params.substr(-1) == "/" && "/" || "";

      tag = tag.toLowerCase();

      // tag is not allowed, return empty string
      if (!tag.match(testAllowed)) return "";

      // tag is allowed
      else {
        // regexp objects for a particular tag
        tagAttr = tag in allowedAttributes && allowedAttributes[tag];
        wildcardAttr = "*" in allowedAttributes && allowedAttributes["*"];

        // if no attribs are allowed
        if (!tagAttr && !wildcardAttr) return "<" + lslash + tag + rslash + ">";

        // remove trailing slash if any
        params = params.trim();
        if (rslash) {
          params = params.substr(0, params.length - 1);
        }

        // find and remove unwanted attributes
        params = params.replace(findAttribs, function (original, space, name, quot, value) {
          name = name.toLowerCase();

          if (!value && !quot) {
            value = "";
            quot = '"';
          } else if (!value) {
            value = quot;
            quot = '"';
          }

          // force data: and javascript: links and images to #
          if ((name == "href" || name == "src") && (value.trim().substr(0, "javascript:".length) == "javascript:" || value.trim().substr(0, "data:".length) == "data:")) {
            value = "#";
          }

          // scope links and sources to http protocol
          if (forceProtocol && (name == "href" || name == "src") && !/^[a-zA-Z]{3,5}:\/\//.test(value)) {
            value = "http://" + value;
          }

          return space + name + "=" + quot + value + quot;

/*if ((wildcardAttr && name.match(wildcardAttr)) || (tagAttr && name.match(tagAttr))) {
            return space + name + "=" + quot + value + quot;
          } else return "";*/
        });

        return "<" + lslash + tag + (params ? " " + params : "") + rslash + ">";
      }

    });
  }
}



exports.savePost = savePost;
exports.getPosts = getPosts;
exports.getByTitle = getByTitle;
exports.getBySearch = getBySearch;
exports.getByCategory = getByCategory;
exports.getByAuthor = getByAuthor;
exports.getImage = getImage;
exports.getImageList = getImageList;
exports.getPDF = getPDF;
exports.uploadImage = uploadImage;
exports.convertMarkdownToHTML = convertMarkdownToHTML;
exports.authenticate = authenticate;

exports.blog = blog;
