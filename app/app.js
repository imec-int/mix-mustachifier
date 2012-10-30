var express 	= require('express');
var http 		= require('http-get');
var Step 		= require('step');
var socketio	= require('socket.io');
var async		= require('async');


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

	socket.on('controller.publishtowall', function (data) {
		//doorgeven aan de wall:
		io.sockets.emit('wall.publish', data);
	});

	socket.on('camera.clearcontroller', function (data) {
		console.log("clearing controller");

		//doorgeven aan de controller:
		io.sockets.emit('controller.clearcontroller', data);
	});



});


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














