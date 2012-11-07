App = {
	socket: null,
	localMediaStream: null,
	starttime: null,
	detectorWorker: null,
	video: null,
	canvas: null,
	mustache: null,
	debug: false, //aanzetten om de kaderkes te zien


	start: function () {

		console.log("hello world");

		//initialize global objects:
		App.socket = io.connect(window.location.hostname);
		App.detectorWorker = new Worker("/javascripts/haar-detector.js"),
		App.video = document.querySelector('video'),
		App.canvas = document.querySelector('#maincanvas'),
		App.mustache = new Image();
		App.mustache.src = "/images/mustache.png";


		// Connect webcam to video:
		navigator.webkitGetUserMedia({
			video: true //we willen enkel video
		}, function (stream) {
			App.video.src = window.webkitURL.createObjectURL(stream);
			App.localMediaStream = stream;
		}, function(e) {
			console.log('got no stream', e);
		});



		App.socket.on('camera.clearcamera', function (data) {
			console.log("clearing camera")

			App.resetUI();
		});

		// On key press:
		$(document).keydown(function(evt) {

			//BACKSPACE
			if (evt.keyCode == 8) {
				evt.preventDefault();
				App.resetUI();
			}

			//SPACE & ENTER
			if (evt.keyCode == 32 || evt.keyCode == 13) {
				$("#time").html("x");
				$("#tryagain").hide();

				App.starttime = (new Date()).getTime();

				var found = false;

				Step(
					function () {
						App.clearController();

						App.takePicture(App.canvas, this);
					},

					function (err) {
						if(err) throw err;

						App.detectObjects(App.canvas, 0, 0, App.canvas.width, App.canvas.height, haarcascade_frontalface_alt2, this);
					},

					function (err, faces) {
						console.log("faces done");
						if(err) throw err;


						for(var i=0; i < faces.length; i++){
							faces[i].width = 1.1 * faces[i].width;
							faces[i].height = 1.8 * faces[i].height;
							faces[i].y = faces[i].y - 0.2 * faces[i].height;
						}


						async.forEachSeries(faces, function (face, asyncCallback){

							if(App.debug){
								var ctx = App.canvas.getContext('2d');
								ctx.strokeStyle="rgba(255,0,0,1)"; //rood
								ctx.strokeRect(face.x,face.y,face.width,face.height); //kader rond gezicht
							}

							App.detectObjects(App.canvas, face.x,face.y,face.width,face.height, haarcascade_mcs_mouth, function (err, mouths){
								if(err == 'NO_OBJECTS_FOUND'){
									asyncCallback(null);
								}else if(err){
									asyncCallback(err);
								}else{
									console.log("found mouths: " + mouths.length);

									found = true;

									if(App.debug){
										// debug:
										for(var i=0; i < mouths.length; i++){
											var ctx = App.canvas.getContext('2d');
											ctx.strokeStyle="rgba(0,0,255,1)"; //blauw
											ctx.strokeRect(mouths[i].x,mouths[i].y,mouths[i].width,mouths[i].height); //kader rond mond
										}
									}

									if(mouths.length == 1){
										App.mustachify(App.canvas, mouths[0]);
									}else{
										var lowestMouth = mouths[0];

										for(var i=1; i < mouths.length; i++){
											if((mouths[i].y + mouths[i].height) > (lowestMouth.y + lowestMouth.height))
												lowestMouth = mouths[i];

										}

										App.mustachify(App.canvas, lowestMouth);
									}

									asyncCallback(null);
								}
							});

						}, this);
					},

					function (err) {
						if(err) throw err;

						App.vignettify(App.canvas, this);
					},

					function (err) {
						if(err) throw err;

						App.frameIt(App.canvas);
						App.sendToServer(App.canvas);

						$("#instructions").html("Press BACKSPACE to try again");

						this();
					},

					function (err) {
						if(err){
							console.log(err);
							$("#tryagain").show();
							App.resetUI();
						}else if(!found){
							console.log("no mouths found");
							$("#tryagain").show();
							App.resetUI();
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
		$("#instructions").html("Press SPACE");
		$("#maincanvas").hide();
		$("video").show();
		$("#time").html("x");
		App.clearController();
	},

	// met callback
	takePicture: function (canvas, callback) {
		if (App.localMediaStream) {

			var ctx = canvas.getContext('2d');
			ctx.drawImage(App.video, 0, 0);

			//Flash effect:
			$("video").fadeOut(100, function(){
				$("#maincanvas").fadeIn(100);
			});

			callback();
		}else{
			callback("NO_STREAM_TO_TAKE_PICTURE");
		}
	},

	// met callback
	detectObjects: function(canvas, left, top, width, height, haardata, callback){
		App.detectorWorker.postMessage({set:{
			imagedata: canvas.getContext('2d').getImageData(left, top, width, height),
			haardata: haardata,
			ratio: 1
		}});

		App.detectorWorker.onmessage = function (event) {
			if(event.data.err){
				callback(event.data.err);
			}

			if(event.data.objects && event.data.objects.length > 0){
				var offsetObjects = event.data.objects;
				var objects = [];

				for(var i=0; i < offsetObjects.length; i++){
					rect = offsetObjects[i];

					objects.push({
						x: rect.x + left,
						y: rect.y + top,
						width: rect.width,
						height: rect.height
					});
				}

				callback(null, objects);
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

		//mustache tekenen:
		var w = 2.5 * rect.width; // breedte is factor van de breedte van het kot
		var h = (App.mustache.height * w)/App.mustache.width; //juiste verhouding voor hoogte

		var x = rect.x + rect.width/2 - w/2; // int midden van het kot
		var y = rect.y - h/2; //beetje boven het kot

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
		var scaledcanvas =  document.querySelector('#scaledcanvas');
		var ctx = scaledcanvas.getContext('2d');

		scaledcanvas.width = App.canvas.width/2;
		scaledcanvas.height = App.canvas.height/2;

		ctx.drawImage(App.canvas, 0, 0, scaledcanvas.width, scaledcanvas.height);

		App.socket.emit('camera.newpicture', {
			picture: canvas.toDataURL('image/png'),
			scaledpicture: scaledcanvas.toDataURL('image/jpeg'),
			id: App.generateID()
		});
	}

}


$(App.start);