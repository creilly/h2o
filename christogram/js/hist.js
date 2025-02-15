var height = 500, width = 800;
var xMargin = .2;
var yMargin = .2;

//to represent canvas on document load
var canvas = null;

//drawing context
var c = null;

//to represent bars on document load
var plots = null;

//called when creating new plot
var plotCounter = 1;

function createPlot(data) {
		
	if (!plots.hasClass('in')) {
		plots.prev().children('.accordion-toggle').click();
	}

	//@off
	
	if (plots.children().length < 2) {
		plots.children('#no-plots').hide();
	}

	var plotName = 'plot' + plotCounter.toString();

	var plot = $('<div>')
		.addClass('accordion-group')
		.addClass('alert')
		.addClass('fade')
		.addClass('in')
		.addClass('plot')
		.data('data', data.sort(function(a,b){return a - b}));

	var close = $('<a><i class="icon-remove" /></a>')
		.addClass('close')
		.attr('data-dismiss', 'alert');

	plot.append(close);

	var heading = $('<div>')
		.addClass('accordion-heading')
		.addClass('container-fluid');

	var headingrow = $('<div></div>')
		.addClass('row-fluid');

	var active = $('<input />')
		.addClass('span3')
		.addClass('active')
		.prop('type', 'checkbox')
		.prop('checked', 'true');

	headingrow.append(active);

    var exportdata = $('<a>')
	.addClass('span3')
	.addClass('btn')
	.addClass('btn-small')
	.addClass('export-data')
	.attr('rel','tooltip')
	.attr('title','export histogram data')

    var exporticon = $('<span>')
	.addClass('icon-download')

    exportdata.append(exporticon)
    
    headingrow.append(exportdata)

	var toggle = $('<a>')
		.addClass('accordion-toggle')
		.addClass('span6')
		.addClass('plot-title')
		.attr('href', '#' + plotName)
		.attr('data-parent', '#' + plots.attr('id'))
		.attr('data-toggle', 'collapse')
		.html(plotName);

	headingrow.append(toggle);

	heading.append(headingrow);

	plot.append(heading);

	var body = $('<div>')
		.addClass('accordion-body')
		.addClass('collapse')
		.attr('id', plotName);

	var properties = $('<form>')
		.addClass('accordion-inner');

	properties.append($('<label>' + 'Plot Name' + '</label>'));

	var title = $('<input />')
		.addClass('title')
		.prop('type', 'text')
		.prop('value', plotName);

	properties.append(title);

	properties.append($('<label>' + 'bin number' + '</label>'));

	var binnumber = $('<input />')
		.addClass('binnumber')
		.prop('type', 'number')
		.prop('min',1)
		.prop('step', 1)
		.prop('value', 50);

	properties.append(binnumber);

	properties.append($('<label>' + 'color' + '</label>'));

	var color = $('<input />')
		.addClass('color')
		.prop('type', 'color');

	properties.append(color);

	body.append(properties);

	plot.append(body);
	
	//@on

	//handle logic
	
	$('input',plot).addClass('input-medium');

	plot.on('closed', plotRemoved);

    exportdata.click(exportDataRequested);

	// start shown
	active.trigger('change');
	// hide/show
	active.change(activeChanged);

	// change title on enter pressed
	title.keyup(function(e) {
		if (e.keyCode == 13) {
			titleChanged(this);
		}
	});

	// binnumber
	binnumber.prop('value',50)
	binnumber.change(binnumberChanged)

	//color
	color.change(colorChanged);

	var initColor = '#';

	var rgb = hslToRgb(((23 + 3 * plotCounter ) / 13 ) % 1, .5, .5);

	for (var i in rgb) {
		initColor += Math.round(rgb[i]).toString(16);
	}

	color.prop('value', initColor);

	color.trigger('change');

	plot.addClass('initialized');

	// li to make list sortable
	plots.prepend(plot);

	toggle.trigger('click.collapse.data-api');
	
	updateCanvas();

	plotCounter++;
};

function exportDataRequested() {
    var plot = $(this).parents('.plot')
    var data = plot.data('data');
    var bins = parseInt(plot.find('.binnumber').prop('value'));
    var min = data[0];
    var max = data[data.length - 1];
    var hist = binData(data,bins,min,max);
    var output = '';
    for (var i = 0; i < bins; i++) {
	var bin_location = data[0] + ( i + .5 ) * (max - min) / bins
	output = output + bin_location.toString() + "\t" + hist[i].toString() + "<br>";
    }
    var w = window.open();
    var d = w.document.open('text/plain');
    d.write(output);    
}

function activeChanged() {
	updateCanvas();
}

function binnumberChanged() {
	var plot = $(this).parents('.plot');
	if (boolUpdate(plot)) {
		updateCanvas();
	}
}

function colorChanged() {
	var plot = $(this).parents('.plot');
	$('.plot-title', plot).css('color', this.value);
	if (boolUpdate(plot)) {
		updateCanvas();
	}
		
}

function titleChanged(el) {
	var plot = $(el).parents('.plot');
	$('.plot-title', plot).text(el.value);
}

function plotRemoved() {
	$(this).addClass('dead');
	if (plots.children().length < 3) {
		plots.children('#no-plots').show();
	}
	updateCanvas();
}

function boolUpdate(plot) {
	var result = plot.hasClass('initialized');
	result = result && $('.active', plot).is(':checked');
	return result
}

function updateCanvas() {
	canvas.width = canvas.width;
	var plots = $('.plot:not(.dead)').has('.active:checked');
	
	// get plot min/max
	var min = 'null';
	var max = 'null'; 
	plots.each(function () {
		plotData = $(this).data('data');
		var plotMin = plotData[0];
		var plotMax = plotData[plotData.length - 1]
		if (min == 'null') {
			min = plotMin;
			max = plotMax;
			return
		}
		min = (plotMin - min > 0) ? min : plotMin
		max = (plotMax - max > 0) ? plotMax : max
	});

	var min_raw = parseInt($('#x-min').prop('value')); 
	var max_raw = parseInt($('#x-max').prop('value'));
	//algo needs tweaking
	var min = min + min_raw / 100 * max_raw / 100 * (max-min);
	var max = min + max_raw / 100 * (max - min);
	
	c.lineWidth = 1.5;
	
	plots.each(function () {
		var plot = $(this);
		var data = plot.data('data');
		var bins = Math.floor(parseInt(plot.find('.binnumber').prop('value')) * (max - min) / (data[data.length - 1] - data[0]));
		
		function x (x) {
			return canvas.width*( xMargin + x / bins * ( 1 - 2 * xMargin ) );
		}
		
		var hist = binData(data,bins,min,max);
		var histMax = Math.max.apply(null,hist);
		
		function y (y) {
			return canvas.height * ( 1 - yMargin - y / histMax * ( 1 - 2 * yMargin ));
		};
		
		var color = hexToRgb(plot.find('.color').prop('value'));
		
		c.fillStyle = 'rgba(' + color + ',.7)';
		c.beginPath();
		c.linewidth
		for (var iii in hist) {
			if (hist[iii]) {
				drawRect(iii/bins + .1 /bins, 0, .8 / bins, hist[iii] / histMax);  
			}
		}
		c.closePath();
		c.fill();
		c.stroke();
	});
	
	if (plots.length) drawTicks(min, max);
	
	drawLabels();
	
	drawBBox();


}

function drawTicks(min, max) {
	c.font = 'bold 20px sans-serif';
	c.fillStyle = 'black';
	c.textAlign = 'center';
	c.textBaseline = 'top';
	
	var range = max - min;
	var order = Math.floor(Math.log(range) / Math.LN10) + 1;
	var delta = null;
	var mode = 0; 
	
	while (true) {
		delta = Math.pow(10, order);
		
		// use largest tick division that gives at least 4 ticks
		
		// option code
		// 1 = just numbers
		// 2 = numbers and halves
		// 3 = numbers, quarters, and halves
		if (Math.floor(range * pow(2, mode) / delta) >= 4) break;
		mode = (mode + 1) % 3;
		if (!mode) {
			order = order - 1;
		}
		
	}
	
	var option = 0;
	
	// ticks scaled so the increment by 1
	var tick = Math.floor( min * Math.pow( 10 , -1 * order ) );
	
	// cycle until tick lies in the range
	while (tick + option / pow(2,mode) <  min * Math.pow( 10 , -1 * order) ) {
		option = (option + 1) % pow(2,mode);
		if (!option) tick++;
	}
	
	var height = canvas.height * ( 1 - yMargin );
	while (tick + option / pow(2,mode) < max * Math.pow( 10 , -1 * order )) {
		var width = canvas.width * (xMargin + Math.pow(10,order) * ( tick + option / pow(2,mode) -  Math.pow(10,-1 * order) * min ) / (max - min) * ( 1 - 2 * xMargin ))
		if (option == 0) {
			// write the number
			var sTick = tick.toString()
			if (order < 0) {
				var text = sTick.substr(0,sTick.length + order) + '.' + sTick.substr(sTick.length + order);
			}
			else {
				var text = sTick;
				var i = 0;
				while (i < order) {
					text += '0';
					i++;
				}
			}
			c.fillText( text, width, height );
		}
		else {
			// draw half or quarter tick marks
			c.fillText( ((mode == 2) && (option % 2)) ? '\u25cb' : '\u25cf', width, height );
		}
		option = (option + 1) % pow(2,mode);
		if (!option) tick++;
	}
	
}

function drawLabels() {
	c.fillStyle = 'black';
	c.textAlign = 'center';
	c.textBaseline = 'middle';
	
	c.font = 'bold 30px sans-serif';
	c.fillText($('#title').prop('value'), canvas.width / 2, canvas.height * ( yMargin / 2) );
	
	c.font = 'bold 20px sans-serif';
	c.fillText($('#x-label').prop('value'), canvas.width / 2, canvas.height * (1 - ( yMargin / 2) ) );
	c.fillText($('#y-label').prop('value'), canvas.width * xMargin / 2, canvas.height / 2 );
	
}

function drawRect(x,y,dx,dy) {
	c.color = "black";
	c.rect(
		canvas.width * (xMargin + x * ( 1 - 2 * xMargin )), 
		canvas.height * ( 1 - yMargin + ( y - dy ) * ( 1 - 2 * yMargin) ), 
		canvas.width * dx * (1 - 2 * xMargin), 
		canvas.height * dy * ( 1 - 2 * yMargin )
		// canvas.width * dx * .4 * ( 1 - 2 * xMargin),
		// true

	);
}

function drawBBox() {
	c.rect(
		0,
		0,
		canvas.width,
		canvas.height,
		20
	);
	c.stroke();
}

function activePlot() {
	return plots[plotSelect.selectedIndex];
};

// get an array of n gaussian distributed (approx) random numbers from 0 to 1
function gaussian(n, mean, spread) {

	var ran = Math.random;

	var data = [];

	for (var i = 0; i < n; i++) {
		data[i] = ((ran() + ran() + ran()) / 3 - .5 ) * spread + mean;
	}

	return data;
};

// returns a function that will find the bin number for you
function binner(bins, start, end) {
	return function(x) {
		return Math.floor((x - start ) * bins / (end - start ))
	};
};

// creates a binned array from data and number of bins
function binData(data, bins, min, max) {

	var bin = binner(bins, min, max);

	var hist = [];

	for (var i = 0; i <= bins; i++) {
		hist[i] = 0;
	}
	var i = 0;
	
	while (data[i] < min) {
		i++;		
	}
	while (i < data.length && data[i] < max ) {
		hist[bin(data[i])]++;
		i++;
	}

	return hist;

};

function parseString(s) {
    var data = s.match(/\-?\d+\.?\d*/g);
    for (var i = 0; i < data.length; i++) {
	data[i] = parseFloat(data[i]);
    }
    return data;
};

function handleFileSelect(event) {

	event.stopPropagation();
	event.preventDefault();

	var files = event.target.files ? event.target.files : event.dataTransfer.files;
	
	// FileList object

	//var fileName = file.name ? file.name : 'untitled';
	
	for (var fileIndex in files) {
		
		var file = files[fileIndex];
		
		var reader = new FileReader();

		// Closure to capture the file information.
		reader.onload = onRead;
	
		// Read in the image file as a data URL.
		reader.readAsText(file);
	}

	return false;
};

function onRead(event) {

	var dataString = event.target.result;

	var data = parseString(dataString);

	if (data == -1) {
		//improper data format
		createAlert(
			'error',
			'Warning',
			'incorrect file type'
			);
		return;
	}

	createPlot(data);
}


function handleDragOver(event) {
	event.stopPropagation();
	event.preventDefault();
	event.dataTransfer.dropEffect = 'copy';
	// Explicitly show this is a copy.
	return false;
};

function initializeControls() {
	$('input').addClass('input-medium');
	//set slider ranges
	$('input[type=range]').prop('min', 0).prop('max', 100);
	$('#x-min').prop('max', 99);
	$('#x-max').prop('min', 1);
	$('#x-min').prop('value', 0);
	$('#x-max').prop('value', 100);
	$('#size, #aspect').prop('value', 50);

	//size or aspect routes to same function
	$('#size, #aspect').change(dimsChanged);

	//change x-range
	$('#x-min, #x-max').change(domainChanged);
	
	//change titles
	$('#x-label, #y-label, #title').keyup(function(e) {
		if (e.keyCode == 13) {
			labelsChanged(this);
		}
	});


	//add plot button
	$('#add-plot').click(function() {$('input[type=file]').click();}).tooltip({delay: {show: 500, hide: 100}});
	$('input[type=file]').change(handleFileSelect);
	
	//export plot button
	$('#export-plot').click(function() {window.open(canvas.toDataURL('image/png'));}).tooltip({delay: {show: 500, hide: 100}});
	
	$('.menu-title').click(function () {
		$('span',$(this)).toggleClass('icon-arrow-down').toggleClass('icon-arrow-right');
	});
	
	window.addEventListener('dragover', handleDragOver, false);
  	window.addEventListener('drop', handleFileSelect, false);

};

function labelsChanged() {
	updateCanvas();
}

//change x-range
function domainChanged() {
	updateCanvas();
}

//change canvas dimensions
function dimsChanged() {
	var aspect = $('#aspect').prop('value');
	var size = $('#size').prop('value');
	canvas.width = width * size / 50 * (.3 + aspect / 100 * .4 ) * 2;
	canvas.height = height * size / 50 * (.3 + (100 - aspect ) / 100 * .4 ) * 2;
	updateCanvas();
}

//utility for generating formatted controls
function controlGroup(name, type) {
	//@off
	return $('<div>')
		.addClass('control-group')
		.append(
			$('<label>')
			.addClass('control-label')
			.prop('for', name)
			.html(name))
			.append(
				$('<div>')
				.addClass('controls')
				.append(
					$('<input />')
					.prop('id', name)
					.prop('type', type)
				)
			);
	//@on
}

function createAlert(type, alert, text) {
	$('<div>')
	.addClass('alert')
	.addClass('alert-' + type)
	.addClass('fade')
	.addClass('in')
	.append(
		$('<button>')
		.prop('type','button')
		.addClass('close')
		.attr('data-dismiss','alert')
		.append(
			$('<i>')
			.addClass('icon-remove')
		)
	)
	.append(
		 $('<strong>')
		 .text(alert + ': ')
	)
	.append(
		$('<span>')
		.append( ' ' + text)
	)
	.prependTo('.control-panel');
}

$(function() {

	canvas = document.getElementById('hist');

	canvas.width = width;

	canvas.height = height;

	c = canvas.getContext('2d');

	plots = $('#plots');

	dimsChanged();

	initializeControls();
	
	createPlot(gaussian(500,.5,.01));
	
	createPlot(gaussian(300,.505,.01));
	
	createPlot(gaussian(400,.502,.01));

});

function hslToRgb(h, s, l) {
	var r, g, b;

	if (s == 0) {
		r = g = b = l;
		// achromatic
	} else {
		function hue2rgb(p, q, t) {
			if (t < 0)
				t += 1;
			if (t > 1)
				t -= 1;
			if (t < 1 / 6)
				return p + (q - p) * 6 * t;
			if (t < 1 / 2)
				return q;
			if (t < 2 / 3)
				return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return [r * 255, g * 255, b * 255];
}

function hexToRgb(hex) {
	rgb = [];
	var iii = 0;
    while (iii < 3) {
    	rgb.push(parseInt(hex.substring(2 * iii + 1, 2 * iii + 3),16).toString());
    	iii++;
    }
    return rgb.join(',');
}

CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == "undefined") {
        stroke = true;
    }
    if (typeof radius === "undefined") {
        radius = 5;
    }
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
    if (stroke) {
        this.stroke(stroke);
    }
    if (fill) {
        this.fill(fill);
    }
};

// integer exponentiation
function pow(x,y) {
	var result = 1;
	var i = 0;
	while (i < y) {
		result *= x;
		i++;
	}
	return result;
}

// set up sortable
$(function() {
    $( ".sortable" ).sortable({
    	placeholder: "ui-state-highlight",
    	axis: "y",
    	update: function(event, ui) {
    		updateCanvas();
    	}
    });
});
