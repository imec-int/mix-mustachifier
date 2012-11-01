App = {

	id: null,

	start: function () {
		$("#picture").hide();
		App.disableUI();

		// socket.io initialiseren
		App.socket = io.connect(window.location.hostname);

		App.socket.on('controller.newpicture', function (data) {

			var image = new Image();
			image.onload = function(){
				$("#picture").attr('src', data.picture);
				App.id = data.id;
				$("#picture").fadeIn();
				App.enableUI();
			};
			image.src = data.picture;
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
			twitterhandle: $("#twitterhandle").val(),
			showontwitter: $("#checkshowontwitter").is(':checked')
		});

		$("#picture").fadeOut(function(){
			$("#picture").attr('src', '');
			App.id = null;
			App.disableUI();
		});
	},

	disableUI: function() {
		$("#twitterhandle").val(""),
		$("#checkshowontwitter").removeAttr('checked');
		$("button").attr('disabled', 'disabled');
		$("input").attr('disabled', 'disabled');
	},

	enableUI: function() {
		$("button").removeAttr('disabled');
		$("input").removeAttr('disabled');
	}
}

$(App.start);