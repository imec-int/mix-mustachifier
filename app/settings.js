exports.title = 'Student Kick-Off Photo Booth';
exports.controllertitle = 'Photo Booth Controller';
exports.walltitle = "The Daily MiX";


exports.wallTitle = function (twitteruser) {
	// twitteruser contains:
	// * name
	// * profileimage
	// * twitterhandle
	// * description
	// * location

	if(twitteruser){
		return twitteruser.name + " gesnord op de Dag van de Wetenschap";
	}else{
		return "Weer iemand gesnord op de Dag van de Wetenschap";
	}
}

exports.wallSubtitle = function (twitteruser) {
	// twitteruser contains:
	// * name
	// * profileimage
	// * twitterhandle
	// * description
	// * location

	if(twitteruser){
		if(twitteruser.description && twitteruser.location){
			return twitteruser.description + " <b>uit</b> " + twitteruser.location + " <b>ontkent alles...</b>";
		}else if(twitteruser.description && !twitteruser.location){
			return twitteruser.description + " <b>ontkent alles...</b>";
		}else if(!twitteruser.description && twitteruser.location){
			return "<b>De persoon uit</b> " + twitteruser.location + " <b>ontkent alles..</b>";
		}
	}

	return "Hij of zij ontkent alles...";
}

exports.simpleTweet = function () {
	return "Weer iemand met een snor gespot op de Dag van de Wetenschap #dagvandewetenschap #iMinds";
};

exports.mentionTweet = function (twitterhandle) {
	return ".@" + twitterhandle + " met een snor gespot op de Dag van de Wetenschap #dagvandewetenschap #iMinds";
};

exports.twitterterms = [
	'#iMinds',
	'#dagvandewetenschap',
	'dag van de wetenschap'
];


/*
exports.wallTitle = function (twitteruser) {
	// twitteruser contains:
	// * name
	// * profileimage
	// * twitterhandle
	// * description
	// * location

	if(twitteruser){
		return twitteruser.name + " spotted with a Moustache at MiX Booth";
	}else{
		return "Someone spotted with a Moustache at MiX Booth";
	}
}

exports.wallSubtitle = function (twitteruser) {
	// twitteruser contains:
	// * name
	// * profileimage
	// * twitterhandle
	// * description
	// * location

	if(twitteruser){
		if(twitteruser.description && twitteruser.location){
			return twitteruser.description + " <b>from</b> " + twitteruser.location + " <b>denies everything...</b>";
		}else if(twitteruser.description && !twitteruser.location){
			return twitteruser.description + " <b>denies everything...</b>";
		}else if(!twitteruser.description && twitteruser.location){
			return "<b>The person from</b> " + twitteruser.location + " <b>denies everything...</b>";
		}
	}

	return "That person denies it...";
}

exports.simpleTweet = function () {
	return "Another person spotted with a moustache at the MiX Booth #iMinds #cmdays12";
};

exports.mentionTweet = function (twitterhandle) {
	return ".@" + twitterhandle + " spotted with a moustache at the MiX Booth #iMinds #cmdays12";
};

exports.twitterterms = [
	'#iMinds',
	'#gaza',
	'dag van de wetenschap'
];
*/