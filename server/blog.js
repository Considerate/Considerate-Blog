var dateFormat = require('dateformat');
var cradle = require('cradle');
var db = new(cradle.Connection)('http://considerate.couchone.com', 80, {
  cache: true,
  raw: false
}).database('blogdemo');
var fs = require('fs');
var temp = require('temp');

/**
 * Get all posts
 */

var last_key = {};
var last_id = null;
function getPosts(blog,callback, options) {
	var skip = 1;
	options = options || {};
	var limit = options.limit || 2;
	if(last_id === null) {
		skip = 0;
	}
	if(options.pagination === true) {
		options = {
			startkey: last_key,
			startkey_docid: last_id,
			skip: skip,
			limit: limit,
			descending: true
		};
	}
	
	db.view("blog/all",options, function(err, res) {
		var posts = [];
		//console.log(res);
		res.forEach(function(key,row, id) {
			var post,images,image_data;
			post = row;
			images = [];
			var date = new Date(post.created);
		  post.date = dateFormat(date,"yyyy-mm-dd HH:MM");
	  
		  //Generate image URLs
		  for(var index in row._attachments){
			   if(row._attachments.hasOwnProperty(index)){
				    image_data = row._attachments[index];
				    images.push({
					      imageId: index,
					      content_type: image_data.content_type,
					      src: "/images/blog/"+row._id+"/"+index 
			    	});
			   }
		  }
		  post.images = images;
		  post.slug = generateSlug(post.title);
		  post.categoryLink = "/blog/category/"+generateSlug(post.category);
		  posts.push(post);
		  console.log("key",key);
		  console.log("id",id);
		  last_key = key;
		  last_id = id;
	  });
	  getLatest(blog,function (latest) {
		    blog.latest = latest;
	     	callback(posts,latest);
    });
    console.log(last_key);
	});
}

/**
 * Get post by title
 */
function getByTitle(blog,title,callback) {
	var last_key = {};
	var last_id = null;
	var title = generateSlug(title);
	getPosts(blog, function (posts) {
		var result = posts.filter(function (item) {
			//Filter out all not matching search query
			return (item.slug === title);
		});
		var post = result[0];
		callback(post);
	});
}

/**
 * Get posts with title matching search criteria
 */
function getBySearch(blog,searchQuery,callback) {
	var last_key = {};
	var last_id = null;
	getPosts(blog, function (posts) {
		var result = posts.filter(function (item) {
			//Filter out all not matching search query
			return (item.slug.match(searchQuery) || item.text.match(searchQuery));
		});
		callback(result);
	});
}


/**
 * Get posts with category name
 */
function getByCategory(blog,category,callback) {
	var lowerCategory;
	lowerCategory = generateSlug(category);
	var last_key = {};
	var last_id = null;
	getPosts(blog, function (posts) {
		var result = posts.filter(function (item) {
			//Filter out all not matching category
			return (generateSlug(item.category) === lowerCategory);
		});
		callback(result);
	});
}

/**
 * Get the latest posts
 */
function getLatest(blog,callback) {
	db.view("blog/datesort", {descending: true, limit:5}, function(err, res) {
    var latest;
    latest = [];
	  res.forEach(function(row) {
			latest.push({
				link: "/blog/"+generateSlug(row.title),
				text: row.title
			});
	  });
		callback(latest);
	});
}

function generateSlug(string) {
	var slug;
	slug = string.replace(/[^a-zA-Z0-9]+/g,'-');
	slug = slug.toLowerCase();
	return slug;
}


/**
 * Get an image from the database
 */
function getImage(docId,imageId,out) {
	var streamer;
	streamer = db.getAttachment(docId,imageId);
  streamer.addListener('data', function (chunk) { 
	  out.write(chunk, "binary");
  });
  streamer.addListener('end', function () {
    out.end()
  });
}

function getPDF(options) {
	
	if(options.css) {
		temp.open('pdfCss', function(err, info) {
		  fs.write(info.fd, options.css);
		  fs.close(info.fd);
		  options.cssFile = info.path;
		  delete options.css;
		  getPDF(options);
		});
	}
	else {
		var cssFileName = options.cssFile || __dirname+"/../stylesheets/pdf.css";
		// Generate PDF constructor
		var PDF = require("node-wkhtml").pdf({ 
		  'margin-top': 0, 
		  'margin-bottom': 0, 
		  'margin-left': 0, 
		  'margin-right': 0,
		  'dpi': 300,
			"user-style-sheet": cssFileName
		}); 
		
		temp.open('pdf', function(err, info) {
		  fs.write(info.fd, options.css);
		  fs.close(info.fd);
			var filename = info.path;
			var pdf = new PDF(options);
			pdf.convertAs(filename, function(err, stdout) {
				 getPDFFile(filename,options.response);
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
  inp.on('data', function(data) {
    response.write(data, "binary");
  });
  inp.on('end', function(close) {
    response.end();
  });
  inp.on('error', function(error) {
    console.log('FS-Error: ' + error);
    response.end();
  });
  inp.on('close', function(close) {
    response.end();
  });
}


//Basic blog template data
var blog = {
  title: "An awesome blog",
  about: "This is a test blog for demonstrating the sheer power that JavaScript posseses.",
  social: [
  {
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
	nav: [
	{
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
	  text:"Martial Arts",
	  link: "/blog/category/martial-arts"
	}]
}


exports.getPosts = getPosts;
exports.getByTitle = getByTitle;
exports.getBySearch = getBySearch;
exports.getByCategory = getByCategory;
exports.getImage = getImage;
exports.getPDF = getPDF;

exports.blog = blog;
