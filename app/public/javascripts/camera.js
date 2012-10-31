App = {
	socket: null,
	localMediaStream: null,
	starttime: null,
	detectorWorker: null,


	start: function () {

		console.log("hello world");

		// socket.io initialiseren
		App.socket = io.connect(window.location.hostname);

		// mustache laden:
		var mustache = new Image();
		mustache.src = "/images/mustache.png";

		var video = document.querySelector('video');
		var canvas = document.querySelector('canvas');
		var ctx = canvas.getContext('2d');


		App.detectorWorker = new Worker("/javascripts/haar-detector.js");

		App.detectorWorker.onmessage = function (event) {
			if(event.data.err){
				console.log(event.data.err);
			}

			if(event.data.objects && event.data.objects.length > 0){
				var objects = event.data.objects;

				var milliseconds = (new Date()).getTime() - App.starttime;

				$("#time").html(milliseconds/1000);

				for(var i=0; i < objects.length; i++){
					var rect = objects[i];
					//ctx.strokeRect(rect.x,rect.y,rect.width,rect.height);

					//mustache tekenen:
					var w = 3 * rect.width; // breedte is factor van de breedte van het kot
					var h = (mustache.height * w)/mustache.width; //juiste verhouding voor hoogte

					var x = rect.x + rect.width/2 - w/2; // int midden van het kot
					var y = rect.y + (rect.height - h/1.2); //bijna helemaal onderaan het kot

					ctx.drawImage(mustache, x, y, w, h);
				}

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
					callback: function(){
						console.log("vignette done");

						//kaderke er rond
						ctx.lineWidth = 15;
						ctx.strokeStyle="rgba(0,0,0,1)";
						ctx.globalCompositeOperation = 'source-over';
						ctx.strokeRect(0,0,canvas.width,canvas.height);
					}
				});

				App.sendToServer(canvas);

			}else{
				$("#tryagain").show();
				App.resetUI();
			}


		};

		// Connect to webcam:
		navigator.webkitGetUserMedia({
			video: true //we willen enkel video
		}, function (stream) {
			video.src = window.webkitURL.createObjectURL(stream);
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

				if (App.localMediaStream) {
					canvas.width = $("video").width();
					canvas.height = $("video").height();

					ctx.drawImage(video, 0, 0);

					//Flash effect:
					$("video").fadeOut(100, function(){
						$("canvas").fadeIn(100);
					});


					ctx.strokeStyle="rgba(0,255,0,1)";

					App.starttime = (new Date()).getTime();

					App.detectorWorker.postMessage({set:{
						imagedata: canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height),
						haardata: haarcascade_mcs_nose,
						ratio: 1
					}});

					App.detectorWorker.postMessage({detect:{
						baseScale: 1,
						scale_inc: 1.25,
						increment: 0.1,
						min_neighbors: 1,
						doCannyPruning: true
					}});
				}
			}
		});
	},

	clearController: function(){
		App.socket.emit('camera.clearcontroller', {});
	},

	sendToServer: function(canvas){
		App.socket.emit('camera.newpicture', {
			picture: canvas.toDataURL('image/png'),
			id: App.generateID()
		});
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
	}
}


$(App.start);