# MiX Moustacher

![Header](http://labm.github.com/imindsmustache/img/header.jpg)

To attract visitors to our booth at the [iMinds conference](http://iminds.creativemediadays.be "iMinds The Conference"), [Sam Decrock](https://github.com/samdecrock) and [Matthias De Geyther](https://github.com/matthiasdg), both working at [MiX](http://mix.iminds.be "MiX"), cooked up this nifty moustachify app. Visitors could take a picture of themselves with the built-in camera of a laptop. It would then draw a moustache under their nose and apply an Instagram like effect. They could then user the controller on the tablet to enter their twitter username and publish it on our wall (our 55" television screen) and/or to twitter.

## How to use

The webapp uses Node.js as a back-end. So make sure you installed [Node.js](http://nodejs.org/ "Node.js"). You will also need to create a twitter app to allow our app to post tweets in your name. Go to [dev.twitter.com/apps](https://dev.twitter.com/apps) to create the appropriate keys. Don't forget to set the permission of the twitter app to "read-write". After you updated /app/twitterkeys.js with your keys, you can run our app. Navigate to the /app folder and run

> node app.js

Every part of this app is accessed through the browser. We recommend Google Chrome.

### Camera

The camera uses the browser's native API to access the webcam (so no Flash involved!). The current implementation only works on webkit (use Google Chrome!). Navigate to the root of the webapp. e.g.: http://10.100.1.10:3000/ Use space/backspace to take a picture or retry.
![Camera](http://labm.github.com/imindsmustache/img/camera.jpg)

### Controller

The controller is used to enter your twitter username and to publish it to our wall and/or to Twitter. Navigate to /controller. e.g.: http://10.100.1.10:3000/controller We used an iPad as a controller but any device with a browser will do.
![Controller](http://labm.github.com/imindsmustache/img/controller.jpg)

### Wall

The wall displays the moustachified pictures. Navigate to /wall. e.g.: http://10.100.1.10:3000/wall The wall also displays slides with more info on our team and what we do. Based on the hashtags of the conference, the wall also displays the tweets from the conference.
![Wall](http://labm.github.com/imindsmustache/img/wall.jpg)

## Technical information

The web app is built entirely with JavaScript/HTML5/CSS3. It uses [Node.js](http://nodejs.org) at the back-end.

### The Camera
The camera is accessed through the browser's native [navigator.getUserMedia()](http://www.html5rocks.com/en/tutorials/getusermedia/intro/). To detect the right spot for the moustache, we do some face detection right in the browser! We use a modified version of [HAAR.js](https://github.com/foo123/HAAR.js), which is based on the haar cascades implementation of openCV. We use [Web Workers](http://www.html5rocks.com/en/tutorials/workers/basics/) to run the detection algorithm in a separate thread so the browser doesn't hang. The algorithm first detects the faces and then searches for a mouth inside those faces. So make sure you smile when using this ;-). It then draws a moustache right above the mouth. It also applies an Instagram like effect. This is done using a modified version of [Vintage.js](http://vintagejs.com/). Whereas Vintage.js uses an image as a starting point, we use the canvas as the starting point. Finally a black border is drawn around the picture. The canvas data is then send to the server using [socket.io](http://socket.io/). Two versions are send to the server: a full size png version and a scaled jpeg version. The latter is send to the Controller for speed.

### The Controller
Through socket.io, the scaled picture arrives at the controller. Here, the user can choose to publish their picture to twitter and/or post it to our wall. If they enter their twitter username, they are mentioned in the tweet. The layout of the controller (and of the camera) is designed using [Foundation 3](http://foundation.zurb.com/).

### The wall
The front-end for the "wall" is build using [Backbone.js](http://documentcloud.github.com/backbone/). The wall receives it's data through socket.io. If the user also entered their twitter username, information from their twitter account is pulled and displayed on the wall.


