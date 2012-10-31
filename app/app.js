var express 	= require('express');
var http 		= require('http-get');
var Step 		= require('step');
var socketio	= require('socket.io');
var async		= require('async');
var OAuth = require('oauth').OAuth;
var keys = require('./twitterkeys');
var TwitPic = require('twitpic').TwitPic;

/**
 * Webserver stuff:
 */
 var webserver = module.exports = express.createServer();
 webserver.configure(function(){
	webserver.set('views', __dirname + '/views');
	webserver.set('view engine', 'jade');
	webserver.use(express.bodyParser());
	webserver.use(express.methodOverride());
	webserver.use(require('stylus').middleware({ src: __dirname + '/public' }));
	var oneYear = 31536000000; //1 year in ms
	webserver.use(express.static(__dirname + '/public', { maxAge : oneYear}));
	webserver.use(express.cookieParser());
	webserver.use(express.session({cookie: { path: '/', httpOnly: false, maxAge: null }, secret:'imindsmoustache'}));
	webserver.use(webserver.router);
});
webserver.configure('development', function(){
	webserver.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
webserver.configure('production', function(){
	webserver.use(express.errorHandler());
});
if (!module.parent) {
	webserver.listen(3000);
}

/**
 * Socket.IO
 */
var io = socketio.listen(webserver);
io.set('log level', 0);


io.sockets.on('connection', function (socket) {
	socket.on('camera.newpicture', function (data) {

		//doorgeven aan de wall:
		io.sockets.emit('wall.publish', data);

		//doorgeven aan de controller:
		io.sockets.emit('controller.newpicture', data);


		var picname;

		// opslaan voor later:
		Step(
			function () {
				picname = "pic_" + data.id + ".png";
				var buffer = new Buffer(data.picture.replace(/^data:image\/png;base64,/,""), 'base64');
				require("fs").writeFile(__dirname + "/public/mustacheimages/" + picname, buffer, this);
			},

			function (err) {
				if(err) throw err;
			}
		);
	});


	socket.on('camera.clearcontroller', function (data) {
		//doorgeven aan de controller:
		io.sockets.emit('controller.clearcontroller', data);
	});



});


// twitter initialisatie

var tp = new TwitPic();
tp.config(function (config) {
  config.apiKey = keys.twitpickey;
  config.consumerKey = keys.consumerKey;
  config.consumerSecret = keys.consumerSecret;
  config.oauthToken = keys.token;
  config.oauthSecret = keys.secret;
});

// authentication for other twitter requests
var tweeter = new OAuth(
	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	keys.consumerKey,
	keys.consumerSecret,
	"1.0",
	null,
	"HMAC-SHA1"
);






/**
 * Webserver routes
 */
webserver.get('/', function(req, res){
	res.render('camera', {
		title: "MiX Mustacher",
		layout: null
	});
});


webserver.get('/controller', function (req, res){
	res.render('controller', {
		title: "MiX Mustache Controller",
		layout: null
	});
});

webserver.get('/wall', function (req, res){
	res.render('wall', {
		title: "The Daily MiX",
		layout: null
	});
});



// POST PICTURE to TWITTER

// ?picname=bla&message=blo
webserver.get('/tweetimage', function(req, res){
	tp.uploadAndPost({path: __dirname + "/public/mustacheimages/" + req.query.picname, message: req.query.message}, function (data) {
	  // console.log(data);
	});
	res.end();
});


// GET USERDETAILS + TWEETS

// /userinfo?id=twitterhandle
webserver.get('/userinfo', function(req, res){
	var message = {};
	var recenttweets = [];
	// %23 doet url-encoding van de hashtag
	tweeter.getProtectedResource('https://api.twitter.com/1.1/users/show.json?screen_name=%23'+req.query.id,
		"GET", keys.token, keys.secret,
		function(error, data, response){
			if(error) {
				console.log('Error: '+ JSON.stringify(error)+'\n');
				res.json({err: error});
			}
			else {
				data = JSON.parse(data);
				message = {name: data.name,
					profileimage: data.profile_image_url,
					twitterhandle: data.screen_name,
					description: data.description
				};

				tweeter.getProtectedResource('https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name='+req.query.id,
					"GET", keys.token, keys.secret,
					function(error2, data2, response){
						if(error2)
							res.json(message);
						else{
							data2=JSON.parse(data2);
							for(var i=0; i< data2.length; i++){
								recenttweets[i] = {text: data2[i].text,
									created_at: data2[i].created_at,
									name: data2[i].user.name,
									profileimage: data2[i].user.profile_image_url,
									twitterhandle: data2[i].user.screen_name
								}
							}
							message.tweets = recenttweets;
							res.json(message);
						}
					}
				);
			}
		}
	);
});

// SEARCH TWEETS for # q

// search tweets ?q=
webserver.get('/search', function(req, res){
	// console.log(req.query.q);
	tweeter.getProtectedResource('https://api.twitter.com/1.1/search/tweets.json?q='+req.query.q,
		"GET", keys.token, keys.secret,
		function(error, data, response){
			if(error){
				res.json({err: error});
			}
			else{
				var tweets = [];
				data = JSON.parse(data);
				for(var i=0; i<data.statuses.length; i++){
					tweets[i] = { text: data.statuses[i].text,
						created_at: data.statuses[i].created_at,
						profileimage: data.statuses[i].user.profile_image_url,
						name: data.statuses[i].user.name,
						twitterhandle: data.statuses[i].user.screen_name
					};
				}
				res.json(tweets);
			}
	});
});













