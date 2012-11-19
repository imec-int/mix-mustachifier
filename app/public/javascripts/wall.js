App = {
	picturesInCache:{},
	offsetLeft: 0,
	timeouthandle:'',
	timeoutAfterpublishHandle:'',
	counter: 0,
	slidenumber: 1,
	timeoutvalue: 30000,
	showingtwitter: false,
	start: function (){
		App.moustacheCollection = new App.MoustacheCollection();
		App.tweetsCollection = new App.TweetsCollection();
		App.articlelistView = new App.ArticlelistView();

		// socket.io initialiseren
		App.socket = io.connect(window.location.hostname);

		// doorgeven dat we de wall zijn
		App.socket.emit('wall.ping', {});
		App.socket.on('reconnect', function(){
			App.socket.emit('wall.ping', {});
		});

		App.socket.on('wall.newpicture', function (data) {
			App.picturesInCache[data.id] = data.picture; //bewaren om sneller te laden straks
		});

		App.socket.on('wall.publish', function (data) {
			var articleModel = new App.ArticleModel({
				twittername: data.twittername,
				picture:  App.picturesInCache[data.id], //terug ophalen
				subtitle: data.subtitle,
				tweets: data.tweets
			});
			if(App.timeouthandle) clearTimeout(App.timeouthandle);
			if(App.timeoutAfterpublishHandle) clearTimeout(App.timeoutAfterpublishHandle);
			App.counter = 0;
			App.slidenumber = 1;
			App.timeoutAfterpublishHandle= setTimeout(App.rotateStuff, App.timeoutvalue);

			App.moustacheCollection.add(articleModel);
		});

		App.socket.on('wall.showtweets', function (data) {
			var tweetsModel = new App.TweetsModel({
				searchterm: data.searchterm,
				tweets: data.tweets
			});

			App.tweetsCollection.add(tweetsModel);
		});

		App.socket.on('wall.newtweet', function (data) {

			function addTweet(data){
				var thetemplate= $("#singletweetpl");
				var html = thetemplate.tmpl(data);

				$(html).hide();
				html.prependTo($(".bigtweets").last());
				$(html).fadeIn();

			}

			if(data.profileimage){
				var preloadImage = new Image();
				preloadImage.onload = function(){
					addTweet(data);
				}
				preloadImage.src = data.profileimage;
			}else{
				addTweet(data);
			}


		});
	},

	rotateStuff: function(){
		var twitterbox = $('input:checkbox[name=twitter]');
		var moustachebox = $('input:checkbox[name=moustache]');
		var mixbox = $('input:checkbox[name=mix]');
		// laatste foto's opnieuw tonen
		if(moustachebox.attr('checked'))
		{
			if(App.moustacheCollection.length>1 && App.counter<App.moustacheCollection.length){
				App.articlelistView.renterMoustache(App.moustacheCollection.at(App.counter));
				App.showingtwitter = false;
				App.counter+=1;
				App.timeouthandle = setTimeout(App.rotateStuff, App.timeoutvalue);
			}
			else {
				App.counter=0;
				if(twitterbox.attr('checked') && !App.showingtwitter){
					$.post("/rest/showtwitterfeed", {checked: true});
					App.showingtwitter =true;
					App.timeouthandle = setTimeout(App.showMixSlides, App.timeoutvalue);
				}
				else{
					if(mixbox.attr('checked')){
						App.showingtwitter = false;
						App.showMixSlides();
					}
					else App.timeouthandle = setTimeout(App.rotateStuff, App.timeoutvalue);
				}
			}

		}
		else{
			App.counter=0;
			if(twitterbox.attr('checked') && !App.showingtwitter){
				$.post("/rest/showtwitterfeed", {checked: true});
				App.showingtwitter =true;
				App.timeouthandle = setTimeout(App.rotateStuff, App.timeoutvalue);
			}
			else{
				if(mixbox.attr('checked')){
					App.showingtwitter = false;
					App.showMixSlides();
				}
				else App.timeouthandle = setTimeout(App.rotateStuff, App.timeoutvalue);
			}
		}
	},

	showMixSlides: function(){
		if($('input:checkbox[name=mix]').attr('checked') && App.slidenumber< 6){
			App.showingtwitter = false;
			var slideid = "#slide"+App.slidenumber;
			var clone = $(slideid).clone();
			$("#articles").append(clone);
			App.doSlide();
			App.slidenumber+=1;
			App.timeouthandle = setTimeout(App.showMixSlides, App.timeoutvalue);
		}
		else{
			App.slidenumber = 1;
			App.rotateStuff();
		}
	},

	doSlide: function(){
		var firstarticle = $('.article').first();
		firstarticle.animate({width: '0'}, 1000, function(){firstarticle.remove();});
	}
};


// Backbone list view
App.ArticlelistView = Backbone.View.extend({
	el: "#articles",

	initialize: function(){
		App.moustacheCollection.bind("add", this.renterMoustache, this);
		App.tweetsCollection.bind("add", this.renderTweets, this);
	},

	renterMoustache: function(model){
		var self = this;

		// image preloaden:
		var imageObject = new Image();
		imageObject.src = model.get("picture");
		// article pas tonen als image gepreload is:
		imageObject.onload = function(){
			var articleView = new App.ArticleView({model: model});
			var renderedArticle = articleView.render().el;
			$(self.el).append(renderedArticle);
			App.doSlide();
		}
	},

	renderTweets: function(model){
		var tweetsView = new App.TweetsView({model: model});
		$(this.el).append(tweetsView.render().el);
		App.doSlide();
	}
});

//Backbone View:
App.ArticleView = Backbone.View.extend({
	tagName: "div",
	className: "article",

	initialize: function(){
		this.template = $("#article-template");

		this.model.bind('destroy', this.destroy_handler, this);
	},

	render: function(){
		var html = this.template.tmpl(this.model.toJSON());
		$(this.el).html(html);
		return this;
	},

	destroy_handler: function(model){
		console.log("destroy");
		$(this.el).remove();
	}
});

//Backbone View:
App.TweetsView = Backbone.View.extend({
	tagName: "div",
	className: "article",

	initialize: function(){
		this.template = $("#tweets-template");

		this.model.bind('destroy', this.destroy_handler, this);
	},

	render: function(){
		var html = this.template.tmpl(this.model.toJSON());
		$(this.el).html(html);
		return this;
	},

	destroy_handler: function(model){
		console.log("destroy");
		$(this.el).remove();
	}
});


//Backbone Model:
App.ArticleModel = Backbone.Model.extend({
	// required:
	// * title
	// * time
	// * picture (url to image)
	// * content
});

App.TweetsModel = Backbone.Model.extend({
	// required:
	// * searchterm
	// * tweets
});

// Backbone Collection
App.MoustacheCollection = Backbone.Collection.extend({
	model: App.ArticleModel
});

App.TweetsCollection = Backbone.Collection.extend({
	model: App.TweetsModel
});

$(App.start);