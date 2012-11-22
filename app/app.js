var express 	= require('express');
var Step 		= require('step');
var socketio	= require('socket.io');
var async		= require('async');
var OAuth       = require('oauth').OAuth;
var https       = require('https');
var keys        = require('./twitterkeys');
var settings    = require('./settings');


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


		if(data.twitterhandle){
			//Hier alle twittebrol opbouwen voor die user:

			getTweetsFromPerson(data.twitterhandle, function (err, message){
				if(err){
					publishAnonymously(data);
				}else{
					data.twittername = message.name;
					data.subtitle = "<b>" + message.description + "</b> from <b>" + message.location + "</b> denies everything...";
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
		sendDataToController('controller.clearcontroller', data);
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

				sendDataToController('controller.newpicture', {
					picture: '/mustacheimages/' + lowrespicname,
					id: data.id
				});
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

function sendDataToController (msg, data) {
	for(var i in socketidsController){
		var socketId = socketidsController[i];
		io.sockets.socket(socketId).emit(msg, data);
	}
}

function publishAnonymously(data){
	data.twittername = "Someone";
	data.subtitle = "He denies it...";
	data.tweets = [];

	//doorgeven aan de wall:
	//io.sockets.emit('wall.publish', data);

	sendDataToWall('wall.publish', data);
}

function publishToTwitter(data){
	var tweet = settings.simpleTweet();

	if(data.twitterhandle)
		tweet = settings.mentionTweet(data.twitterhandle);

	postPictureToTwitter(tweet, "pic_" + data.id + ".png");
}

// als er minuut niemand komt: tweets tonen
function pushTweets(){
	searchTwitterForHash(encodeURIComponent(settings.twitterterms.join(' OR ')), function (err, tweets){
		var data = {
			searchterm: settings.twitterterms.join(', '), //title on the wall
			tweets: tweets
		};

		console.log("sending tweets to wall");
		sendDataToWall('wall.showtweets', data);
	});
}




/**
 * Webserver routes
 */
webserver.get('/', function(req, res){
	res.render('camera', {
		title: "MiX Mustacher",
		layout: null
	});
});

//dublicate:
webserver.get('/camera', function(req, res){
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


// the wall requests tweets:
webserver.post('/rest/showtwitterfeed', function(req, res){
	pushTweets(); //tweets are send using socket.io
	res.json({err:0}); //'empty' response to the client
});


function getTweetsFromPerson(twitterhandle, callback){
	var message = {};

	Step(
		function (){
			tweeter.getProtectedResource('https://api.twitter.com/1.1/users/show.json?screen_name='+twitterhandle, "GET", keys.token, keys.secret, this);
		},

		// get user data:
		function (err, data, response){
			if(err) throw err;

			data = JSON.parse(data);
			message = {name: data.name,
				profileimage: data.profile_image_url,
				twitterhandle: data.screen_name,
				description: data.description,
				location: data.location
			};

			tweeter.getProtectedResource('https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name='+twitterhandle, "GET", keys.token, keys.secret, this);
		},

		// get tweets of that user:
		function (err, data, response){
			if(err) throw err;

			data = JSON.parse(data);
			var recenttweets = [];
			for(var i=0; i< data.length; i++){
				recenttweets.push({text: data[i].text,
					created_at: data[i].created_at,
					name: data[i].user.name,
					profileimage: data[i].user.profile_image_url,
					twitterhandle: data[i].user.screen_name
				});
			}

			message.tweets = recenttweets;

			callback(null, message);
		},

		function (err) {
			if(err)
				callback(err);
		}
	);
}

// listen for terms / realtime updates
var request = tweeter.get('https://stream.twitter.com/1.1/statuses/filter.json?track=' + encodeURIComponent(settings.twitterterms.join(',')), keys.token, keys.secret);
request.addListener('response', function(response){

	response.setEncoding('utf8');

	response.addListener('data', function(chunk){
		try{
			var data = JSON.parse(chunk);
			var tweet = { text : data.text,
						created_at: data.created_at,
						profileimage: data.user.profile_image_url,
						name: data.user.name,
						twitterhandle: data.user.screen_name};
			//io.sockets.emit('wall.newtweet', tweet);
			sendDataToWall('wall.newtweet', tweet);

		}
		catch(e){}
	});

	response.addListener('end', function(){
		console.log("END");
	});
});
request.end();


function searchTwitterForHash (hash, callback) {
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



function postPictureToTwitter(tweet, photoName, callback){
	var responseData = "";

	var data = require("fs").readFileSync(__dirname + "/public/mustacheimages/" + photoName);
	var oauth = new OAuth(
	    'https://api.twitter.com/oauth/request_token',
	    'https://api.twitter.com/oauth/access_token',
	     keys.consumerKey, keys.consumerSecret,
	    '1.0', null, 'HMAC-SHA1');

	var crlf = "\r\n";
	var boundary = '---------------------------10102754414578508781458777923';

	var separator = '--' + boundary;
	var footer = crlf + separator + '--' + crlf;
	var fileHeader = 'Content-Disposition: file; name="media"; filename="' + photoName + '"';

	var contents = separator + crlf
	    + 'Content-Disposition: form-data; name="status"' + crlf
	    + crlf
	    + tweet + crlf
	    + separator + crlf
	    + fileHeader + crlf
	    + 'Content-Type: image/png' +  crlf
	    + crlf;

	var multipartBody = Buffer.concat([
	    new Buffer(contents),
	    data,
	    new Buffer(footer)]);

	var hostname = 'upload.twitter.com';
	var authorization = oauth.authHeader(
	    'https://upload.twitter.com/1/statuses/update_with_media.json',
	    keys.token, keys.secret, 'POST');

	var headers = {
	    'Authorization': authorization,
	    'Content-Type': 'multipart/form-data; boundary=' + boundary,
	    'Host': hostname,
	    'Content-Length': multipartBody.length,
	    'Connection': 'Keep-Alive'
	};

	var options = {
	    host: hostname,
	    port: 443,
	    path: '/1/statuses/update_with_media.json',
	    method: 'POST',
	    headers: headers
	};

	var request = https.request(options);
	request.write(multipartBody);
	request.end();

	request.on('error', function (err) {
	    console.log('Error: Something is wrong.\n'+JSON.stringify(err)+'\n');
	});

	request.on('response', function (response) {
	    response.setEncoding('utf8');
	    response.on('data', function (chunk) {
	    	responseData += chunk.toString();
	        //console.log(chunk.toString());
	    });
	    response.on('end', function () {
	        //console.log(response.statusCode +'\n');
	        //res.end();

	        if(callback && typeof(callback)==="function")
				callback(responseData);
	    });
	});
}









