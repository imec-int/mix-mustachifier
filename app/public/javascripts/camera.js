App = {
	socket: null,
	localMediaStream: null,
	starttime: null,
	detectorWorker: null,
	video: null,
	canvas: null,
	mustache: null,


	start: function () {

		console.log("hello world");

		//initialize global objects:
		App.detectorWorker = new Worker("/javascripts/haar-detector.js"),
		App.video = document.querySelector('video'),
		App.canvas = document.querySelector('canvas'),
		App.mustache = new Image();
		App.mustache.src = "/images/mustache.png";

		// socket.io initialiseren
		App.socket = io.connect(window.location.hostname);


		// Connect to webcam:
		navigator.webkitGetUserMedia({
			video: true //we willen enkel video
		}, function (stream) {
			App.video.src = window.webkitURL.createObjectURL(stream);
			App.localMediaStream = stream;
		}, function(e) {
			console.log('got no stream', e);
		});

		// On key events:
		$(document).keydown(function(evt) {

			//reset
			if (evt.keyCode == 8) {
				evt.preventDefault();
				App.resetUI();
			}

			//take picture
			if (evt.keyCode == 32 || evt.keyCode == 13) {
				$("#time").html("x");
				$("#tryagain").hide();

				App.clearController();
				App.starttime = (new Date()).getTime();

				Step(
					function () {
						App.takePicture(App.canvas, this);
					},

					function (err) {
						if(err) throw err;

						App.detectObjects(App.canvas, haarcascade_mcs_nose, this);
					},

					function (err, noses) {
						if(err) throw err;

						for(var i=0; i < noses.length; i++){
							App.mustachify(App.canvas, noses[i]);
						}

						App.vignettify(App.canvas, this);
					},

					function (err) {
						if(err) throw err;

						App.frameIt(App.canvas);
						App.sendToServer(App.canvas);

						this();
					},

					function (err) {
						if(err){
							console.log(err);
							$("#tryagain").show();
							App.resetUI();
						}else{
							console.log("done");
						}

						var milliseconds = (new Date()).getTime() - App.starttime;
						$("#time").html(milliseconds/1000);
					}
				);
			}
		});
	},

	clearController: function(){
		App.socket.emit('camera.clearcontroller', {});
	},

	generateID: function(){
		var randomnumber = Math.floor(Math.random()*10000);
		var date = new Date();
		return date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + "_" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds() + "-" + date.getMilliseconds() + "__" + randomnumber;
	},

	resetUI: function(){
		$("canvas").hide();
		$("video").show();
		$("#time").html("x");
		App.clearController();
	},

	// met callback
	takePicture: function (canvas, callback) {
		if (App.localMediaStream) {
			canvas.width = $("video").width();
			canvas.height = $("video").height();

			var ctx = canvas.getContext('2d');
			ctx.drawImage(App.video, 0, 0);

			//Flash effect:
			$("video").fadeOut(100, function(){
				$("canvas").fadeIn(100);
			});

			callback();
		}else{
			callback("NO_STREAM_TO_TAKE_PICTURE");
		}
	},

	// met callback
	detectObjects: function(canvas, haardata, callback){
		App.detectorWorker.postMessage({set:{
			imagedata: canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height),
			haardata: haardata,
			ratio: 1
		}});

		App.detectorWorker.onmessage = function (event) {
			if(event.data.err){
				callback(event.data.err);
			}

			if(event.data.objects && event.data.objects.length > 0){
				callback(null, event.data.objects);
			}else{
				callback('NO_OBJECTS_FOUND');
			}
		};

		App.detectorWorker.postMessage({detect:{
			baseScale: 1,
			scale_inc: 1.25,
			increment: 0.1,
			min_neighbors: 1,
			doCannyPruning: true
		}});
	},

	mustachify: function(canvas, rect){
		var ctx = canvas.getContext('2d');
		ctx.strokeStyle="rgba(0,255,0,1)";

		ctx.strokeRect(rect.x,rect.y,rect.width,rect.height); //debug kader

		//mustache tekenen:
		var w = 3 * rect.width; // breedte is factor van de breedte van het kot
		var h = (App.mustache.height * w)/App.mustache.width; //juiste verhouding voor hoogte

		var x = rect.x + rect.width/2 - w/2; // int midden van het kot
		var y = rect.y + (rect.height - h/1.2); //bijna helemaal onderaan het kot

		ctx.drawImage(App.mustache, x, y, w, h);
	},

	// met callback
	vignettify: function(canvas, callback){
		$(canvas).vintage({
			vignette: {
				black: 1.0,
				white: 0.1
			},
			noise: 20,
			screen: {
				red: 227,
				green: 12,
				blue: 169,
				strength: 0.1
			},
			desaturate: false,
			allowMultiEffect: false,
			mime: 'image/jpeg',
			viewFinder: false,
			callback: callback
		});
	},

	frameIt: function(canvas){
		var ctx = canvas.getContext('2d');

		//kaderke er rond
		ctx.lineWidth = 15;
		ctx.strokeStyle="rgba(0,0,0,1)";
		ctx.globalCompositeOperation = 'source-over';
		ctx.strokeRect(0,0,canvas.width,canvas.height);
	},

	sendToServer: function(canvas){
		App.socket.emit('camera.newpicture', {
			picture: canvas.toDataURL('image/png'),
			id: App.generateID()
		});
	},
}


$(App.start);