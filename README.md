# MiX Moustacher

To attract visitors to our booth at the [iMinds conference](http://iminds.creativemediadays.be "iMinds The Conference"), [Sam Decrock](https://github.com/samdecrock) and [Matthias De Geyther](https://github.com/matthiasdg), both working at [MiX](http://mix.iminds.be "MiX"), cooked up this nifty moustachify app. Visitors could take a picture of themselves with the built-in camera of a laptop. It would then draw a moustache under their nose and apply an effect. Visitors could use the controller on the tablet to enter their Twitter username and to published it on our wall (our 55" television screen) and to Twitter.

## How to use

The webapp uses Node.js as a back-end. So make sure you installed [Node.js](http://nodejs.org/ "Node.js"). To run the app, navigate to the /app folder and run
> node app.js
Every part of this app is accessed through the browser. We recommend Google Chrome.

### Camera

The camera uses the browser's native API to access the webcam (so no Flash involved!). The current implementation only works on webkit. Navigate to the root of the webapp. e.g.: http://10.100.1.10:3000/ Use space and backspace to take a picture or retry.
![Camera](http://labm.github.com/imindsmustache/img/camera.jpg)

### Controller

The controller is used to enter your Twitter username and to publish it to our wall and/or to Twitter. Navigate to /controller. e.g.: http://10.100.1.10:3000/controller
![Controller](http://labm.github.com/imindsmustache/img/controller.jpg)

### Wall

The wall displays the moustachified pictures. Navigate to /wall. e.g.: http://10.100.1.10:3000/wall The wall also includes slides with more info on our team and what we do. The Twitterfeed of the conference is also shown.
![Wall](http://labm.github.com/imindsmustache/img/wall.jpg)



