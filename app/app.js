var express 	= require('express');
var http 		= require('http-get');
var Step 		= require('step');
var socketio	= require('socket.io');
var async		= require('async');

var serverUrl = null;


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


webserver.get('/', function(req, res){
	res.render('camera', {
		title: "iMinds Mustache",
		layout: null
	});
});

/**
 * REST interfaces
 */
webserver.post('/rest/sendphoto', function(req, res){

	var picname;

	Step(
		function (){
			serverUrl = req.headers.origin;

			var photobase64 = req.body.photobase64;
			var photobase64 = photobase64.replace(/^data:image\/png;base64,/,"");
			var dataBuffer = new Buffer(photobase64, 'base64');

			picname = generateFilename("pic", ".png");
			require("fs").writeFile(__dirname + "/public/sourceimages/" + picname, dataBuffer, this);
		},

		function (err){
			if(err) throw err;

			var picurl = serverUrl + "/sourceimages/" + picname;
			var mustachifyUrl = "http://mustachify.me/?src=" + picurl;

			http.get({url: mustachifyUrl}, __dirname + "/public/mustacheimages/" + picname, this);
		},

		function (err, result) {
			if(err) throw err;

			var mustachedPicurl = serverUrl + "/mustacheimages/" + picname;

			var now = new Date();
			var minutes = now.getMinutes();
			if (minutes < 10)
				minutes = "0" + minutes;
			io.sockets.emit('newarticle', {
				title: "Another mustache spotted on the iMinds Conference",
				time: now.getHours() + ":" + minutes,
				image: mustachedPicurl,
				content: "Several people are being spotted with mustaches. This seems to be a new trend."
			});

			res.json({mustachedPicurl:mustachedPicurl});
		},

		function (err) {
			if(err){
				res.json({err: err});
			}
		}
	);

});















