var EASTERN_TIMEZONE = "America/New_York";
var MY_TIMEZONE = moment.tz.guess();
var featuredCategories = ['WorldFootball', 'Ice Hockey', 'NFL', 'BoxingMMA', 'Baseball', 'NCAAF', 'NBA', 'EPL', 'LaLiga', 'Bundesliga', 'Golf', 'Tennis', 'Rugby', 'Formula1', 'Nascar', 'Wrestling', 'News'];
var catalogOfShows;
var channelNames;
var filters;
var feedFile = "https://fast-guide.smoothstreams.tv/altepg/feed1.json";
var $iso;
var preload = false;
var authSign = getParameterByName("wmsAuthSign");

if (window.location.hostname.toLowerCase() === "iptvguide.bitballoon.com")
	window.location = "https://iptvguide.netlify.com/";
if (window.location.protocol !== "https:" && window.location.hostname.toLowerCase() === "iptvguide.netlify.com")
	window.location = "https://iptvguide.netlify.com/";

function getParameterByName(name) {
	var url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function switchFeed() {
	if (feedFile === "https://fast-guide.smoothstreams.tv/altepg/feed1.json")
		feedFile = "https://fast-guide.smoothstreams.tv/altepg/feedall1.json";
	else
		feedFile = "https://fast-guide.smoothstreams.tv/altepg/feed1.json";
	loadFeed();
}

function showChannel(ch) {
	$('.btn').removeClass('pressed');
	$iso.isotope({ filter: ".chan" + ch });
}

Number.prototype.pad = function(size) {
	var s = String(this);
	while (s.length < (size || 2)) {s = "0" + s;}
	return s;
}

function getIcon(name) {
	switch(name) {
		case "NFL":
			return "<i class=\"fas fa-football-ball\"></i>";
			break;
		case "Ice Hockey":
			return "<i class=\"fas fa-hockey-puck\"></i>";
			break;
		case "NBA":
			return "<i class=\"fas fa-basketball-ball\"></i>";
			break;
		case "Golf":
			return "<i class=\"fas fa-golf-ball\"></i>";
			break;
		case "WorldFootball":
			return "<i class=\"fas fa-futbol\"></i>";
			break;
		default:
			return name;
	}
}

function loadFeed() {
	$('#loading').show();
	if ($iso) $iso.isotope('destroy');
	$('.filter-button-global').empty();
	$('.filter-button-category').empty();
	$('#showTable').empty();
	catalogOfShows = [];
	channelNames = [];
	filters = new Object();

	$("#timezone").text(MY_TIMEZONE);
	var getRequest = $.get(feedFile, '', function (data) {
		if (!preload) {
			preload = true;
			$.get("https://fast-guide.smoothstreams.tv/altepg/feedall1.json", '', function (data2) { });
		}

		// for each channel in data
		var now = moment().tz(EASTERN_TIMEZONE);
		$.each(data, function (indexChannel, channel) {
			if (channel.items && channel.items.length > 0) {
				if (channel.name.indexOf(" - ") === -1)
					channelNames[channel.channel_id] = channel.name;
				else
					channelNames[channel.channel_id] = channel.name.split(" - ")[1];
			}

			// for each show in channel
			$.each(channel.items, function (indexShow, show) {
				show.time_m = moment.tz(show.time, EASTERN_TIMEZONE);
				show.end_time_m = moment.tz(show.end_time, EASTERN_TIMEZONE);
				show.channel_name = channelNames[channel.channel_id];

				if (show.category === "tv" || show.category === "TVShows" || show.category === "GeneralTV") {
					var showname = (" " + show.name + " " + show.description + " ").toLowerCase();
					if (showname.indexOf(" news") > -1 || showname.indexOf(" sportscent") > -1 || showname.indexOf(" nightline ") > -1)
						show.category = "News";
					else
						show.category = "Other";
					if (show.category === "GeneralTV")
						show.category = "Other";
				}
				if (show.category && show.category !== "NFL") {
					if (show.name.startsWith("NFL:"))
						show.category = "NFL";
				}

				if ((!show.parent_id || show.parent_id === "0" || show.parent_id === "None") && !show.name.toLowerCase().startsWith("test "))
					if (now.isBefore(show.end_time_m))
						catalogOfShows.push(show);
			});
		});
	}, 'json');

	// after the request, let's sort it
	getRequest.done(function() {
		catalogOfShows.sort(function (showA, showB) {
			if (showA.time_m.isSame(showB.time_m)) {
				var showAName = showA.name.toLowerCase();
				var showBName = showB.name.toLowerCase();

				if (showAName === showBName)
					return 0;
				return showAName < showBName ? -1 : 1;
			}
			return showA.time_m.isBefore(showB.time_m) ? -1 : 1;
		});

		var shows = $("#showTable");

		// for each show, show adjusted date time, etc.
		$.each(catalogOfShows, function (index, show) {
			var showClasses = "";
			if (show.name && show.category && show.name.startsWith(show.category + ":"))
				show.name = show.name.replace(show.category + ":", "").trim();

			if (show.time_m.tz(MY_TIMEZONE).calendar().startsWith("Today "))
				showClasses += " Today";

			var showTime = "";
			var showTitle = "";
			var showDescription = "";
			var showCategory = "";
			var timeAlert = "";
			var channels = "";

			showTime = show.time_m.tz(MY_TIMEZONE).calendar().replace("Today ", "").replace(":00", "").replace(" AM", "A").replace(" PM", "P");
			showTime += "-" + show.end_time_m.tz(MY_TIMEZONE).format("h:mm A").replace(":00", "").replace(" AM", "A").replace(" PM", "P");
			if (showTime.endsWith("P"))
				showTime = showTime.replace("P-", "-");
			else
				showTime = showTime.replace("A-", "-");

			if (show.time_m.tz(MY_TIMEZONE).isBefore(moment()) && show.end_time_m.tz(MY_TIMEZONE).isAfter(moment())) {
				timeAlert = "<br/>ends " + show.end_time_m.tz(MY_TIMEZONE).fromNow();
				showClasses += " Now";
			}
			else if (show.time_m.tz(MY_TIMEZONE).isAfter(moment()) && show.time_m.tz(MY_TIMEZONE).isBefore(moment().add(12, 'hours'))) {
				timeAlert = "<br/>starts " + show.time_m.tz(MY_TIMEZONE).fromNow();
				showClasses += " Upcoming";
			}
			if (show.category && show.category.length > 0) {
				var categ = show.category.replace(/[ +]/g, "");
				showCategory = '<span class="category"> ' + show.category + '</span>';
				showClasses += " cat-" + categ;
				filters['cat-' + categ] = 1;
				if (show.name.startsWith("EPL:")) {
					showClasses += " cat-EPL";
					filters['cat-EPL'] = 1;
				}
				if (show.name.startsWith("La Liga:")) {
					showClasses += " cat-LaLiga";
					filters['cat-LaLiga'] = 1;
				}
				if (show.name.startsWith("Serie A:")) {
					showClasses += " cat-SerieA";
					filters['cat-SerieA'] = 1;
				}
				if (show.name.startsWith("1.BL:")) {
					showClasses += " cat-Bundesliga";
					filters['cat-Bundesliga'] = 1;
				}
			}

			showTitle += '<br/>' + show.name;					
			if (show.quality === "720p" || show.quality === "1080p" || (show.version && show.version.length > 0 && (show.version.indexOf("720P") > -1 || show.version.indexOf("1080P") > -1))) {
				showTitle += ' <strong>HD</strong>';
				if (show.quality === "1080p" || (show.version && show.version.length > 0 && show.version.indexOf("1080P") > -1))
					filters[show.quality] = 1;
				showClasses += " " + show.quality + " HD";
			}
			showClasses += " chan" + show.channel;
			
			if (show.description && show.description.replace("No description", "").length > 2)
				showDescription = ' <a href="#" data-toggle="tooltip" title="' + show.description + '"><i class="glyphicon glyphicon-info-sign"></i></a>';

			var channelWrapBegin = "";
			var channelSD = "";
			var channelLQ = "";
			var channelWrapEnd = "";
			if (!authSign && authHash)
				authSign = authHash;
			if (authSign && authSign.length > 0) {
				channelWrapBegin = '<a href="rtmp://dna.smoothstreams.tv:3625/viewstvn?wmsAuthSign=' + authSign + '/ch' + Number(show.channel).pad(2) + 'q1.stream">';
				channelSD = '<a href="rtmp://dna.smoothstreams.tv:3625/viewstvn?wmsAuthSign=' + authSign + '/ch' + Number(show.channel).pad(2) + 'q2.stream">SD</a>';
				channelLQ = '<a href="rtmp://dna.smoothstreams.tv:3625/viewstvn?wmsAuthSign=' + authSign + '/ch' + Number(show.channel).pad(2) + 'q3.stream">LQ</a>';
				channelWrapEnd = '</a>';
			}
			if (show.version && show.version.length > 0 && show.version.toLowerCase() !== "none") {
				channels = "<br/>" + channelNames[show.channel];
				show.version.split(';').forEach(function(ch) {
					var chTrim = ch.trim().split(' ')[0];
					if (authSign && authSign.length > 0) {
						channelWrapBegin = '<a href="rtmp://dna.smoothstreams.tv:3625/viewstvn?wmsAuthSign=' + authSign + '/ch' + Number(chTrim).pad(2) + 'q1.stream">';
						channelSD = '<a href="rtmp://dna.smoothstreams.tv:3625/viewstvn?wmsAuthSign=' + authSign + '/ch' + Number(chTrim).pad(2) + 'q2.stream">SD</a>';
						channelLQ = '<a href="rtmp://dna.smoothstreams.tv:3625/viewstvn?wmsAuthSign=' + authSign + '/ch' + Number(chTrim).pad(2) + 'q3.stream">LQ</a>';
					}
					channels += "<br/>" + channelWrapBegin + "Ch " + ch.trim() + channelWrapEnd + " | " + channelSD + " | " + channelLQ;
				});
			}
			else if (show.language && show.language.length > 0)
				channels = "<br/>" + channelWrapBegin + "Ch " + show.channel + " " + channelNames[show.channel] + " (" + show.language.toUpperCase() + ")" + channelWrapEnd + " | " + channelSD + " | " + channelLQ;
			else
				channels = "<br/>" + channelWrapBegin + "Ch " + show.channel + " " + channelNames[show.channel] + channelWrapEnd + " | " + channelSD + " | " + channelLQ;

			shows.append('<div class="grid-item' + showClasses + '" data-end-time="' + show.end_time + '">' + showTime + showCategory + showTitle + showDescription + timeAlert + channels + '</div>');
		});

		$iso = $('#showTable').isotope({
			itemSelector: '.grid-item',
			layoutMode: 'fitRows',
			transitionDuration: '0.15s'
		});

		$('.filter-button-global').append('<button type="button" class="btn btn-info btn-global" data-filter="*">All</button><button type="button" class="btn btn-info btn-global" id="btnNow" data-filter=".Now">Now</button><button type="button" class="btn btn-info btn-global" data-filter=".Upcoming">Upcoming</button><button type="button" class="btn btn-info btn-global" data-filter=".Today">Today</button><button type="button" class="btn btn-info btn-global" data-filter=".HD">HD</button>');

		$('.filter-button-global').append('<div class="btn-group" role="group"><button type="button" class="btn btn-info dropdown-toggle" data-toggle="dropdown">Chan</button><ul class="dropdown-menu" id="channellist"></ul></div>');
		for (var i in channelNames) 
			$('#channellist').append('<li><a href="#" onclick="showChannel(' + i + ')">' + i + ' ' + channelNames[i] + '</a></li>');

		featuredCategories.forEach(function(i) {
			if (filters.hasOwnProperty('cat-' + i))
				$('.filter-button-category').append('<button type="button" class="btn btn-category cat-' + i + '" data-filter=".cat-' + i + '">' + getIcon(i) + '</button>');
		});
		//for (var i in filters)
		//	if (filters.hasOwnProperty(i) && featuredCategories.indexOf(i.replace("cat-", "")) > -1)
		//		$('.filter-button-category').append('<button type="button" class="btn btn-default btn-category ' + i + '" data-filter=".' + i + '">' + i.replace("cat-", "") + '</button>');
		for (var i in filters)
			if (filters.hasOwnProperty(i) && featuredCategories.indexOf(i.replace("cat-", "")) === -1)
				$('.filter-button-category').append('<button type="button" class="btn btn-category ' + i + '" data-filter=".' + i + '">' + i.replace("cat-", "") + '</button>');

		$('.btn.cat-Baseball').addClass('btn-baseball');
		$('.btn.cat-BoxingMMA').addClass('btn-boxingmma');
		$('.btn.cat-Formula1').addClass('btn-formula1');
		$('.btn.cat-GeneralTV').addClass('btn-generaltv');
		$('.btn.cat-Golf').addClass('btn-golf');
		$('.btn.cat-MotorSports').addClass('btn-motorsports');
		$('.btn.cat-Nascar').addClass('btn-nascar');
		$('.btn.cat-NBA').addClass('btn-nba');
		$('.btn.cat-NCAAF').addClass('btn-ncaaf');
		$('.btn.cat-News').addClass('btn-news');
		$('.btn.cat-NFL').addClass('btn-nfl');
		$('.btn.cat-NHL').addClass('btn-nhl');
		$('.btn.cat-OtherSports').addClass('btn-othersports');
		$('.btn.cat-Rugby').addClass('btn-rugby');
		$('.btn.cat-Tennis').addClass('btn-tennis');
		$('.btn.cat-WorldFootball').addClass('btn-worldfootball');
		$('.btn.cat-Wrestling').addClass('btn-wrestling');

		$('.btn-global').click(function() {
			var filterValue = $(this).attr('data-filter');
			if (filterValue === "*")
				$('.btn').removeClass('pressed');
			else {
				if ($(this).hasClass('pressed'))
					$(this).removeClass('pressed')
				else
					$(this).addClass('pressed');
			}

			processFilters();
		});

		$('.btn-category').click(function() {
			if ($(this).hasClass('pressed'))
				$(this).removeClass('pressed')
			else
				$(this).addClass('pressed');

			processFilters();
		});

		function processFilters() {
			var gFilters = [];
			var cFilters = [];
			var filters = "";
			$('.btn-global.pressed').each(function() { gFilters.push($(this).attr('data-filter')); });
			$('.btn-category.pressed').each(function() { cFilters.push($(this).attr('data-filter')); });
			if (gFilters.length === 0)
				gFilters.push("");
			if (cFilters.length === 0)
				cFilters.push("");
			gFilters.forEach(function(g) {
				filters += ", " + g + cFilters.join(', ' + g);
			});

			if (filters.length === 0)
				$iso.isotope({ filter: "*" });
			else {
				filters = filters.substring(2);
				$iso.isotope({ filter: filters });
			}

			if (cFilters.length === 1 && cFilters[0].length > 0)
				$('.category').hide();
			else
				$('.category').show();
		}

		if (authSign && authSign.length > 0) {
			$('#btnNow').addClass('pressed');
			processFilters();
		}

		$('#loading').hide();
	});
}

var authHash;
function login() {
	$.ajax({ url: 'sstvhash.json', context: document.body, datatype: "json" }).done(function(data) {
		if (data.hash) {
			authHash = data.hash;
		}
	});
}

$(function () {
	$('.btn.btn-toggle').click(function() {
		if ($(this).hasClass('btn-grey')) {
			$('.btn-toggle.btn-info').removeClass('btn-info').addClass('btn-grey');
			$(this).removeClass('btn-grey').addClass('btn-info');
			switchFeed();
		}
	});

	login();
	loadFeed();

/*
	moment.locale('en', {
		calendar : {
			lastDay : '[Yest] LT',
			sameDay : '[Today] LT',
			nextDay : '[Tomorrow] LT',
			lastWeek : '[last] dddd [at] LT',
			nextWeek : 'dddd [at] LT',
			sameElse : 'L'
		}
	});
*/
});