var express 	= require('express');
var http 		= require('http-get');
var Step 		= require('step');
var socketio	= require('socket.io');
var cv 			= require('opencv');
var async		= require('async');

var serverUrl = null;



/**
 * Webserver stuff:
 */
 var webserver = module.exports = express.createServer();
 webserver.configure(function(){
	webserver.use(express.bodyParser());
	var oneYear = 31536000000; //1 year in ms
	webserver.use(express.static(__dirname + '/public', { maxAge : oneYear}));
	webserver.use(express.cookieParser());
	webserver.use(express.session({cookie: { path: '/', httpOnly: false, maxAge: null }, secret:'imindsmoustache'}));
	webserver.use(express.methodOverride());
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


webserver.post('/rest/opencv', function(req, res){
	serverUrl = req.headers.origin;

	var filename = generateFilename("pic", ".png");
	var sourceFile = __dirname + "/public/sourceimages/" + filename;
	var destFile = __dirname + "/public/mustacheimages/" + filename;
	var destUrl = serverUrl + "/mustacheimages/" + filename;

	var im;
	var newImageBuffer;

	Step(
		function (){
			var photobase64 = req.body.photobase64;
			var photobase64 = photobase64.replace(/^data:image\/png;base64,/,"");
			var dataBuffer = new Buffer(photobase64, 'base64');

			cv.readImage(dataBuffer, this);
		},

		function (err, im_) {
			if(err) throw err;
			im = im_;

			detectFaces(im, this);
		},

		function (err, faces) {
			if(err) throw err;

			async.forEach(faces, function (face, foreachCallback) {
				drawMustacheOnFace(im, face, foreachCallback);
			}, this);
		},

		function (err) {
			//im.save(destFile);  //niet saven, we geven het gewoon als base64 terug
			var base64output = im.toBuffer().toString('base64');

			if(err){
				res.json({err: err});
			}else{
				res.json({imagedata:"data:image/png;base64," + base64output});
			}
		}
	);
});

function generateFilename(pre, post){
	var randomnumber = Math.floor(Math.random()*10000);
	var date = new Date();
	return pre + "_" + date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + "_" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds() + "-" + date.getMilliseconds() + "__" + randomnumber + post;
}


function detectFaces(im, callback){
	im.detectObject(__dirname + '/opencvdata/haarcascade_frontalface_alt2.xml', {}, callback);
}

function drawMustacheOnFace(im, face, callback){

	var COLOR = [255, 255, 0]; //default = red
	var thickness = 2; // default = 1

	Step(
		function () {
			im.rectangle([face.x, face.y], [face.x + face.width, face.y + face.height], COLOR, thickness);

			im.detectObject(__dirname + '/opencvdata/haarcascade_mcs_mouth.xml', {}, this);
		},

		function (err, mouths) {
			if(err) throw err;

			// groen
			var mounth;
			for(var i=0; i<mouths.length; i++){
				mouth = mouths[i];

				im.rectangle([mouth.x, mouth.y], [mouth.x + mouth.width, mouth.y + mouth.height], [0, 255, 0], thickness);
			}

			im.detectObject(__dirname + '/opencvdata/haarcascade_mcs_nose.xml', {}, this);
		},

		function (err, noses) {
			if(err) throw err;

			// blauw
			var nose;
			for(var i=0; i<noses.length; i++){
				nose = noses[i];

				im.rectangle([nose.x, nose.y], [nose.x + nose.width, nose.y + nose.height], [0, 0, 255], thickness);
			}

			im.detectObject(__dirname + '/opencvdata/haarcascade_mcs_lefteye.xml', {}, this);
		},

		function (err, lefteyes) {
			if(err) throw err;

			// geel
			var lefteye;
			for(var i=0; i<lefteyes.length; i++){
				lefteye = lefteyes[i];

				im.rectangle([lefteye.x, lefteye.y], [lefteye.x + lefteye.width, lefteye.y + lefteye.height], [0, 255, 255], thickness);
			}

			im.detectObject(__dirname + '/opencvdata/haarcascade_mcs_righteye.xml', {}, this);
		},

		function (err, righteyes) {
			if(err) throw err;

			//paars
			var righteye;
			for(var i=0; i<righteyes.length; i++){
				righteye = righteyes[i];

				im.rectangle([righteye.x, righteye.y], [righteye.x + righteye.width, righteye.y + righteye.height], [255, 0, 255], thickness);
			}

			this();
		},

		function (err) {
			if(err) callback(err);
			else callback();
		}

	);
}














