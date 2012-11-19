exports.twitterterms = [
	'#iMinds',
	'#gaza',
	'dag van de wetenschap'
];

exports.simpleTweet = function () {
	return "Another person spotted with a moustache at the MiX Booth #iMinds #cmdays12";
};

exports.mentionTweet = function (twitterhandle) {
	return ".@" + twitterhandle + " spotted with a moustache at the MiX Booth #iMinds #cmdays12";
};