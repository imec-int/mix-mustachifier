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


/**
 * Webserver routes
 */
webserver.get('/', function(req, res){
	res.render('camera', {
		title: "iMinds Mustache",
		layout: null
	});
});


webserver.get('/controller', function (req, res){
	res.render('controller', {
		title: "iMinds Mustache Controller",
		layout: null
	});
});

/**
 * REST interfaces
 */
webserver.post('/rest/sendpicture', function (req, res){

	var picname;

	Step(
		function () {

			serverUrl = req.headers.origin;

			var base64data = req.body.base64data;
			picname = generateFilename("pic", ".png");

			// doorsturen via sockets naar controller:
			io.sockets.emit('controller.newpicture', {
				base64data: base64data,
				picname: picname
			});

			// opslaan voor later:
			var buffer = new Buffer(base64data.replace(/^data:image\/png;base64,/,""), 'base64');
			require("fs").writeFile(__dirname + "/public/mustacheimages/" + picname, buffer, this);
		},

		function (err) {
			if(err) throw err;


			if(err){
				res.json({err: err});
			}else{
				res.json("ok");
			}
		}
	);

});


function generateFilename(pre, post){
	var randomnumber = Math.floor(Math.random()*10000);
	var date = new Date();
	return pre + "_" + date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + "_" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds() + "-" + date.getMilliseconds() + "__" + randomnumber + post;
}
















