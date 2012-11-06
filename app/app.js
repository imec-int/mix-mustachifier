var express 	= require('express');
var Step 		= require('step');
var socketio	= require('socket.io');
var async		= require('async');
var OAuth       = require('oauth').OAuth;
var keys        = require('./twitterkeys');
var TwitPic     = require('twitpic').TwitPic;

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

var timeoutHandle = /*setTimeout(pushiMindstweets, 60000);*/ '';
var tweetsenabled = true;

var socketidsController = [];
var socketidsWall = [];

/**
 * Socket.IO
 */
var io = socketio.listen(webserver);
io.set('log level', 0);


io.sockets.on('connection', function (socket) {

	//controller id's bijhouden (er kunnen meerdere controllers zijn)
	socket.on("controller.ping", function (data) {
		socketidsController.push(socket.id);
	});

	socket.on("wall.ping", function (data) {
		socketidsWall.push(socket.id);
	});



	socket.on('camera.newpicture', function (data) {

		//doorgeven aan de wall:
		sendDataToWall('wall.newpicture', data);

		sendToController(data);


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


	socket.on('controller.publishtowall', function (data) {
		io.sockets.emit('camera.clearcamera', {});

		// timeout tweets resetten
		if(timeoutHandle) clearTimeout(timeoutHandle);
		if(tweetsenabled)
			// timeoutHandle = setTimeout(pushiMindstweets, 60000);

		if(data.twitterhandle){
			//Hier alle twittebrol opbouwen voor die user:

			getTweetsFromPerson(data.twitterhandle, function (err, message){
				if(err){
					publishAnonymously(data);
				}else{
					data.twittername = message.name;
					data.subtitle = message.description + " from " + message.location + " denies everything...";
					data.tweets = message.tweets;

					//doorgeven aan de wall:
					sendDataToWall('wall.publish', data);
				}
			});
		}else{
			publishAnonymously(data);
		}

		if(data.showontwitter){
			publishToTwitter(data);
		}

	});


	socket.on('camera.clearcontroller', function (data) {
		//doorgeven aan de controller:
		io.sockets.emit('controller.clearcontroller', data);
	});

});

function sendToController(data) {
	var lowrespicname;

	//we gaan eens de scaledimage opslaan en dan naar de ipad sturen, wie weet gaat dat sneller

	Step(
		function () {
			lowrespicname = "pic_" + data.id + "_lowres.jpg";
			var buffer = new Buffer(data.scaledpicture.replace(/^data:image\/jpeg;base64,/,""), 'base64');
			require("fs").writeFile(__dirname + "/public/mustacheimages/" + lowrespicname, buffer, this);
		},

		function (err) {
			if(err){
				console.log(err);
			}else{

				for(var i in socketidsController){
					var socketId = socketidsController[i];
					io.sockets.socket(socketId).emit('controller.newpicture', {
						picture: '/mustacheimages/' + lowrespicname,
						id: data.id
					});
				}
			}
		}
	);
}

function sendDataToWall (msg, data) {
	for(var i in socketidsWall){
		var socketId = socketidsWall[i];
		io.sockets.socket(socketId).emit(msg, data);
	}
}

function publishAnonymously(data){
	data.twittername = "Someone";
	data.subtitle = "He denies it...";
	data.tweets = [];

	//doorgeven aan de wall:
	io.sockets.emit('wall.publish', data);
}

function publishToTwitter(data){
	var tweet = "Another person spotted with a moustache at the MiX Booth";

	if(data.twitterhandle)
		tweet = ".@" + data.twitterhandle + " spotted with a moustache at the MiX Booth #iMinds #cmdays12";

	var picfile = __dirname + "/public/mustacheimages/pic_" + data.id + ".png";

	tp.uploadAndPost({path: picfile, message: tweet}, function (data) {
		// console.log(data);
	});
}

// als er minuut niemand komt: tweets tonen

function pushiMindstweets(){
	console.log("searching for iminds");

	searchTwitterForHash("%23failcon12 OR %23iminds OR %23cmdays12", function (err, tweets){
		var data = {
			searchterm: "#iMinds #failcon12 #cmdays12",
			tweets: tweets
		};

		console.log("sending tweets to wall");
		io.sockets.emit('wall.showtweets', data);
	});
}

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

// search #iMinds tweets
webserver.get('/imindstweets', function(req, res){
	searchTwitterForHash("iMinds", function (err, tweets){
		if(err){
			res.json({err: err});
		}else{
			res.json(tweets);
		}
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

// /userinfo
webserver.get('/userinfo', function(req, res){
	getTweetsFromPerson("DecrockSam", function (err, message){
		if(err)
			console.log(err);
		else
			res.json(message);
	});
});

function getTweetsFromPerson(twitterhandle, callback){
	var message = {};
	var recenttweets = [];
	tweeter.getProtectedResource('https://api.twitter.com/1.1/users/show.json?screen_name='+twitterhandle,
		"GET", keys.token, keys.secret,
		function(error, data, response){
			if(error) {
				callback(error);
			}
			else {
				data = JSON.parse(data);
				message = {name: data.name,
					profileimage: data.profile_image_url,
					twitterhandle: data.screen_name,
					description: data.description,
					location: data.location
				};

				//console.log(data);

				tweeter.getProtectedResource('https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name='+twitterhandle,
					"GET", keys.token, keys.secret,
					function(error2, data2, response){
						if(error2)
							callback(error2);
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
							callback(null, message);
						}
					}
				);
			}
		}
	);
}

// listen for single tweets / realtime updates
var request = tweeter.get('https://stream.twitter.com/1.1/statuses/filter.json?track=%23failcon12 OR %23iminds OR %23cmdays12',
	 keys.token, keys.secret);
request.addListener('response', function(response){
	response.setEncoding('utf8');
	response.addListener('data', function(chunk){
		// try omdat hij anders crasht op sommige unparsable chunks
		try{
			var data = JSON.parse(chunk);
			var tweet = { text : data.text,
						created_at: data.created_at,
						profileimage: data.user.profile_image_url,
						name: data.user.name,
						twitterhandle: data.user.screen_name};
			io.sockets.emit('wall.newtweet', tweet);
		}
		catch(e){}
	});
	response.addListener('end', function(){
		console.log('--END--');
	});
});
request.end();



// SEARCH TWEETS for #hash

// search tweets ?hash=iminds
webserver.get('/search', function(req, res){
	// console.log(req.query.q);
	searchTwitterForHash(req.query.hash, function (err, tweets){
		if(err){
			res.json({err: err});
		}else{
			res.json(tweets);
		}
	});
});

function searchTwitterForHash (hash, callback) {
	// %23 doet url-encoding van de hashtag
	tweeter.getProtectedResource('https://api.twitter.com/1.1/search/tweets.json?q=' + hash + '&src=hash', "GET", keys.token, keys.secret,
		function(error, data, response){
			if(error){
				callback(error);
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
				callback(null, tweets);
			}
		}
	);
}

// rest
webserver.post('/rest/showtwitterfeed', function(req, res){
	if(timeoutHandle) clearTimeout(timeoutHandle);
	if(req.body.checked){
		var checked = req.body.checked;
		console.log(checked);
		if(checked === 'true'){
			pushiMindstweets();
			tweetsenabled = true;
		}
		else tweetsenabled = false;
		res.json({err: 0});
	}
	else{
		res.json({err:0});
	}
});











