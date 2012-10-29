App = {
	localMediaStream: null,

	start: function () {
		console.log("hello world");

		var video = document.querySelector('video');
		var canvas = document.querySelector('canvas');

		navigator.webkitGetUserMedia({
			video: true //we willen enkel video
		}, function (stream) {
			video.src = window.webkitURL.createObjectURL(stream);
			App.localMediaStream = stream;
		}, function(e) {
			console.log('got no stream', e);
		});

		$("#mustacheme").click(function(){
			if (App.localMediaStream) {
				canvas.width = $("video").width();
				canvas.height = $("video").height();
				var ctx = canvas.getContext('2d');
				ctx.drawImage(video, 0, 0);

				ctx.strokeStyle="rgba(0,255,0,1)";

				new HAAR.Detector(haarcascade_mcs_nose).image(null, null, canvas).complete(function(){

					for(var i=0; i<this.objects.length; i++){
						var rect=this.objects[i];
						ctx.strokeRect(rect.x,rect.y,rect.width,rect.height);
					}

				}).detect(1, 1.25, 0.1, 1, true);
			}
		});

	}
}

$(App.start);