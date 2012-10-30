App = {

	start: function () {
		// socket.io initialiseren
		App.socket = io.connect(window.location.hostname);
		// some debugging statements concerning socket.io
		App.socket.on('reconnecting', function(seconds){
			console.log('reconnecting in ' + seconds + ' seconds');
		});
		App.socket.on('reconnect', function(){
			console.log('reconnected');
		});
		App.socket.on('reconnect_failed', function(){
			console.log('failed to reconnect');
		});

		// nieuwe artikels komen binnen via de socket, één voor één
		App.socket.on('controller.newpicture', function (data) {

			console.log(data);

			$("#picture").attr('src', data.base64data);
			$("#title").html(data.picname);

		});
	}
}

$(App.start);