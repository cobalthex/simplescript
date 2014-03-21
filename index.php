<?php //Matt Hines -- 2014
define('RULES_FOLDER', @$_GET['rules'] . '/');
define('RULES_FILE', RULES_FOLDER . 'rules.json');

// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(-1);

//load rules
$rules = json_decode(file_get_contents(RULES_FILE), true);
?>
<!doctype html>
<html>
<head>
	<title><?php echo @$rules['title'] ?></title>
	<link rel='stylesheet' href='core.css'>
	<?php if (isset($rules['stylesheet'])): ?>
		<link rel='stylesheet' href='<?php echo RULES_FOLDER . $rules['stylesheet']; ?>'>
	<?php endif; ?>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<script type='text/javascript' src='https://code.jquery.com/jquery.min.js'></script>
	<?php if (file_exists(RULES_FILE)): ?>
	<script type='text/javascript'>
		var parser_rules = null;
		$.getJSON('<?php echo RULES_FILE; ?>', function(rules)
		{
			parser_rules = rules;
			$('head').append($('<script>', { 'id': 'parser_rules_js', 'type': 'text/javascript', 'src': 'core.js' })); //JS must be added after rules are loaded
		$('head').append($('<script>', { 'id': 'custom_js', 'type': 'text/javascript', 'src': <?php echo RULES_FOLDER . @$rules['scriptfile']; ?> }));
		});
	</script>
	<?php endif; ?>
</head>
<body>
	<?php if (!isset($rules)): ?>
		<h1>Error: No rules specified</h1>
	<?php else: ?>

	<div class='fright'>
		<button id='compat-view-btn' title='Display operators in plain text'>Plain-text</button> | 
		<button id='save-proj-btn' title='Save the current project'>Save</button><!-- 
	 --><button id='load-proj-btn' title='Load a saved project'>Load</button>
	</div>
	<h1 title='Simple Scripter'><?php echo @$rules['title']; if (isset($rules['version'])) echo " <span title='Version {$rules['version']}' class='hint'>V{$rules['version']}"; ?></span></h1>
	<hr>
	<noscript id='warn-nojs'>This page works best with javascript enabled</noscript>
	<noscript>
		<style type='text/css'>#qbox, #sidebar, #compat-view-btn { display: none; }</style>
		<textarea id='query_basic'></textarea>
	</noscript>
	<div id='qbox'>
		<div id='sidebar'>
			<div id='sb-actions'>
				<button class='good' title='Execute' id='run-query'>Execute</button>
				<button class='bad' title='Clear the query' id='clear-query'>Clear</button>
			</div>
			<div id='sb-ops'>
				<?php
				foreach ($rules['operators'] as $key => $op)
				{
					if (!is_array($op))
						echo $op;
					else
						printf("<button class='opcreate %s' id='%s' title='%s'>%s</button>", $op['css-class'], $key, $op['hint'], $op['name']);
				}
				?>
				<br>
				<button class='opcreate special' title='New Line' id='op-newline'>New Line</button><!--
			 --><button class='opcreate fullop' title='Full operation' id='op-fullop'>Operation</button><br><!--
			 --><button class='opcreate comment' title='Comment' id='op-comment'>Comment</button>
		</div>
	</div>
	<div title='Resize the sidebar' id='sidebar-resizer'></div>
	<div id='query' tabindex='0'><div id='cursor'>&nbsp;</div></div>
	</div>
	<div id='qbottom'>
		<div title='Resize the query area' id='qbox-resizer'></div>
		<div class='hint fright tright'>Double-click an operator to remove it<br>Drag operators to reorder</div>

		<div id='export-options'>
			Export as 
			<?php
			foreach($rules['exports'] as $key => $exp)
				printf("<button class='export-btn' export-type='%s'>%s</button>", $key, isset($exp['name']) ? $exp['name'] : $exp);
			?>
		</div>
	</div>

	<strong title='Results returned from the query'>Results:</strong>
	<table class='results'>
		<tr>
			<th class='rnum'>#</th>
			<th>A1</th>
			<th>A2</th>
			<th>A3</th>
		</tr>
		<tr>
			<td class='rnum'>1</td>
			<td>V1</td>
			<td>V2</td>
			<td>V3</td>
		</tr>
	</table>

	<?php endif; ?>
</body>
</html>
