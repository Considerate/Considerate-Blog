var name = "My name";

var Viktor = {
	name: "Viktor",
	age: 19,
	hobbies: ["Karate","Piano","Programming"],
	say: function() {
		console.log("My name is "+this.name+" and my hobbies are "+this.hobbies.join(", "));
	}
}

Viktor.say();

var newViktor = {
	age: 20,
	name: "New Improved Viktor v2.03.1b4",
	hobbies: ["none"]
};
Viktor.say.call(newViktor);



function test() {
	var i,x,y,index;
	
	y = 5;
	i = 11;
	if(i < 10)
	{
		x = 4;
	}
	
	
	
	for(index = 0; index < 6; index++) {
		//console.log(index);
	}
	
	var obj = {
	  cat: "Theo",
	  TV: "Plasma",
	  Food: "Bread"
	};
	
	for(index in obj) {
		if(obj.hasOwnProperty(index)) {
			var value = obj[index];
			console.log(index,value);
		}
	}
	
	var arr = ["one","two","three"];
	
	for(index = 0; index < arr.length; index++) {
		console.log(arr[index]);
	}

	
}


function doSomeAwesomeStuff(options) {
	options.callback = options.callback || function() {};
	options.errback = options.errback || function() {};
	
	var minValue = 20;
	
	if(options.value < 20) {
		options.errback(new Error("Values have to be over 19"));
	}
	
	var post = {
		title: "Hello",
		date: new Date(), //now
		views: 400 000
	}
	
	options.callback(post);
}

doSomeAwesomeStuff({
	callback: function(post) {
		
	},
	errback: function(error) {
		console.log(error);
	}
});


function printIndex(i) {
	console.log(i);
}
//console.log(y);
test();

var obj = {}

function Person(name) {
	this.name = name;
	this.speak = function() {
		console.log("Hello, my name is: "+this.name);
	}
}

var viktor = new Person("Viktor Erik Mikael Kronvall");
//viktor.speak();

function mainLogic (time) {
	setTimeout(obj.oncomplete,time);
	obj.oncomplete(); //trigger complete function
}

function runWithCallback(str,time) {
  obj.oncomplete = function() {
	   console.log(str);
  }
  mainLogic(time);
}

//runWithCallback("Hello World!",2000);

