App = {

	id: null,

	start: function () {
		$("#picture").hide();
		App.disableUI();

		// socket.io initialiseren
		App.socket = io.connect(window.location.hostname);

		App.socket.on('controller.newpicture', function (data) {
			$("#picture").attr('src', data.picture);
			App.id = data.id;
			$("#picture").fadeIn();
			App.enableUI();
		});

		App.socket.on('controller.clearcontroller', function (data) {
			console.log("clearing controller")

			$("#picture").fadeOut(function(){
				$("#picture").attr('src', '');
				App.id = null;
				App.disableUI();
			});
		});


		$("#publish").click(App.publishToWall);
	},


	publishToWall: function (event) {
		App.socket.emit('controller.publishtowall', {
			id: App.id,
			twitterhandle: $("#twitterhandle").val()
		});
	},

	disableUI: function() {
		$("button").attr('disabled', 'disabled');
		$("input").attr('disabled', 'disabled');
	},

	enableUI: function() {
		$("button").removeAttr('disabled');
		$("input").removeAttr('disabled');
	}
}

$(App.start);