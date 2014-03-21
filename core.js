//Format string function
if (!String.prototype.format)
{
	String.prototype.format = function ()
	{
		var args = arguments;
		return this.replace(/{(\d+)}/g, function (match, number)
			{ return typeof args[number] !== undefined ? args[number] : match; });
	};
}

$(document).ready(function()
{
	//fix sidebar height
	$('#sb-ops').height($('#sidebar').height() - $('#sb-actions').outerHeight(true));

	//remove existing ops (in case of reload)
	$('#op-placer, #sizer').remove();

	var $query = $('#query');
	var $csr = $('#cursor');
	var $sizer = $('<span>', { id: 'sizer' }); //div for auto sizing input
	var $placer = $('<div>', { id: 'op-placer', 'class': 'op placer' }).html(' ');
	var $op = null; //original place
	$('body').append($sizer);

	//operator moving
	var $drag = null;
	var moved = false;
	var ox, oy; //operator original x,y for drag

	//qbox/sidebar resizing
	var qmoved = false;
	var smoved = false;
	var qoy; //qbox original y for resize
	var sox; //sidebar original x for resize

	//find div under cursor
	var $hover = null;

	//$(document).on('mouseleave', '.op:not(.placer)', function(ev) { $hover = null; });
	$(document).on('keydown', function(ev) { if (ev.which == 27 && $drag != null) { $placer.insertBefore($op); $(document).trigger('mouseup'); } });

	//resize qbox (query)
	$(document).on('mousedown', '#qbox-resizer', function(ev)
	{
		var po = $(this).offset();
		qoy = ev.pageY - po.top + $('#qbox').offset().top;
		qmoved = true;
	});
	//resize sidebar
	$(document).on('mousedown', '#sidebar-resizer', function(ev)
	{
		var po = $(this).offset();
		sox = ev.pageX - po.left + $('#sidebar').offset().left;
		smoved = true;
	});

	//drag operator
	$(document).on('mousedown', '.op', function(ev)
	{
		$drag = $(this);

		var po = $drag.offset();
		ox = ev.pageX - po.left;
		oy = ev.pageY - po.top;

	});
	$(document).on('mouseup', function(ev)
	{
		//qbox/sidebar resize reset
		qmoved = false;
		smoved = false;

		//move operator
		if ($drag !== null)
		{
			if (moved)
			{
				$drag.insertBefore($placer);

				if ($drag.hasClass('newline')) //move the newline as well
					$drag.data('breaker').insertAfter($drag);

				$placer.detach();
				moved = false;
			}
			$drag.css({ 'position': '', 'opacity': 1 });
			$drag = null;
			$placer.detach();
		}
	});
	$(document).on('mousemove', function(ev)
	{
		//qbox V resize
		if (qmoved)
		{
			$('#qbox').height(ev.pageY - qoy);
			//fix sidebar height
			$('#sb-ops').height($('#sidebar').height() - $('#sb-actions').outerHeight(true));
		}
		//sidebar H resize
		if (smoved)
			$('#sidebar').width(ev.pageX - sox);

		//move operator in query window
		if ($drag !== null)
		{
			//set up the dragger appearance
			if (!moved)
			{
				$op = $drag.next();
				$placer.insertBefore($drag);
				$drag.css({ 'position': 'absolute', 'opacity': 0.5 });
				$placer.width($drag.width()).height($drag.height());
				moved = true;
			}
			else
			{
				$drag.css('display', 'none');
				$hover = $(document.elementFromPoint(ev.pageX, ev.pageY));
				$hp = $hover.parents('.op');

				if ($hp.length) //insert before/after operator
				{
					//get side of div (insert before if on left half, after otherwise)
					var w = $hp.outerWidth();
					if (ev.pageX - $hp.offset().left <= w / 2)
						$placer.insertBefore($hp[0]);
					else
						$placer.insertAfter($hp[0]);
				}
				else if ($hover.is('#cursor')) //place at end
					$placer.insertBefore($csr);

				//comment following to disable auto update of structure on moving newline op
				if ($drag.hasClass('newline')) //move the newline as well
					$drag.data('breaker').insertAfter($placer);

				$drag.css('display', 'inline-block');
			}

			$drag.offset({ left: ev.pageX - ox, top: ev.pageY - oy });
		}
	});

	//auto size inputs in ops on typing in query window
	$(document).on('keyup', '.op input', function(ev)
	{
		$sizer.text($(this).val() + String.fromCharCode(ev.which));
		$(this).width($sizer.width() + 10);
	});


	//remove ops if clicked on in query
	$(document).on('dblclick', '.op:not(.placer,input)', function(ev)
	{
		var $this = $(this);
		$this.fadeOut(100, function()
		{
			//newlines have to remove br
			if ($this.hasClass('newline'))
				$this.next().remove();
			$this.remove();
		});
	});

	//add operators to query window after clicking
	$('.opcreate').on('click', function(ev)
	{
		//ev.preventDefault();
		var $op = $('<div>', { 'from': this.id, 'class': 'op' });
		
		//only print if exists (special operators do not)
		if (parser_rules.operators[this.id])
			$op.html(parser_rules.operators[this.id]['html']); //get html from parser rules

		$op.addClass($(this).attr('class')).removeClass('opcreate');
		$csr.before($op);	
		$(this).trigger('opcreate', [ $op ]);
		$('#query').scrollTop($('#query').prop("scrollHeight")); //auto scroll to bottom when new div is added
	});

	//adding special operators
	$('#op-newline').on('opcreate', function(ev, op)
	{
		//newline is special
		op.removeClass('special').addClass('newline').html('&#8629;')
		var br = $('<br>');
		op.data('breaker', br);
		op.after(br);
	});
	$('#op-fullop, #op-comment').on('opcreate', function(ev, op) { op.append('<input class="wide">'); });

	$('#clear-query').on('click', function(ev) { ev.preventDefault(); if (window.confirm('Are you sure you wish to remove your query?\nNote: you cannot undo this.')) $csr.prevAll().remove(); });

	//export
	$('.export-btn').on('click', function(ev)
	{
		ev.preventDefault();

		var type = $(this).attr('export-type');
		if (!type)
			return;

		var exporter = parser_rules.exports[type];

		var date = new Date();
		var dateFmt = '{0} {1} {2}'.format(date.getFullYear(), date.getMonth() + 1, date.getDate());
		var content = exporter.header ? exporter.header.replace(/__date__/gmi, dateFmt) : '';

		$('#query .op').each(function (idx)
		{
			var $this = $(this);
			var opType = $this.attr('from');

			//generate a list of all of the inputs in the operator
			var inputs = [];
			$this.find('input').each(function() { inputs.push($(this).val()); });

			//add the operator from the rules with the inputs provided
			//newline and fullop have custom rules
			if (opType == 'op-newline')
				content += String.prototype.format.apply(exporter.newline, inputs);
			else if (opType == 'op-fullop')
				content += String.prototype.format.apply(exporter.fullop, inputs);
			else if (opType == 'op-comment')
				content += String.prototype.format.apply(exporter.comment, inputs);
			else if (parser_rules.operators[opType])
				content += String.prototype.format.apply(parser_rules.operators[opType]['export'][type], inputs);
			else
				console.warn('Error: No rule for "' + opType + '"');
		});
		if (exporter.footer)
			content += exporter.footer;

		ShowInWindow(content);
	});

	$('#compat-view-btn').on('click', function(ev)
	{
		ev.preventDefault();

		//convert all sidebar ops

	});

	//Show 'Contents' in a popup window
	function ShowInWindow(Contents)
	{
		//create the popup
		var winWid = 640;
		var winHgt = 640;

		var winLeft = (screen.width - winWid) / 2;
		var winTop = (screen.height - winHgt) / 2;

		var w = window.open('', 'export-wnd', 'width={0},height={1},left={2},top={3},scrollbar=yes,resizable=yes,toolbar=no'.format(winWid, winHgt, winLeft, winTop));
		w.document.body.innerHTML = '<style type="text/css">body { padding: 4px; } pre { font-family: monospace; font-size: 16pt; height: 100%; width: 100%; height: 100%; } pre:focus { outline: none }</style><pre contenteditable="true">' + Contents + '</pre>'; //default styling and content
		w.focus();
	}

	console.log('Loaded Simple Scripter');
});

//A simple helper function to reload the rules (Reruns core script as well but does not add new operators)
function ReloadRules(JsonFile)
{
	$.getJSON(JsonFile, function(rules)
	{
		parser_rules = rules;
		$('#parser_rules_js, #custom_js').remove();
		$('head').append($('<script>', { 'id': 'parser_rules_js', 'type': 'text/javascript', 'src': 'core.js' })); //JS must be added after rules are loaded
		$('head').append($('<script>', { 'id': 'custom_js', 'type': 'text/javascript', 'src': rules.scriptfile }));
	});
}
