<?php

echo 'ok';
$settings = array(
	'xapi_url' => '',
	'oapi_url' => ''
);

$queryType = $_GET['qt'];
$query = $_GET['q'];
$bbox = $_GET['bb'];

switch( $queryType )
{
	case 'xapi':
		queryXapi($settings, $bbox, $query);
		break;
	case 'oapi':
		queryOapi($settings, $bbox, $query);
		break;
}

function queryXapi($settings, $bbox, $query)
{
	error_log( __FUNCTION__.', bbox: '.$bbox.', query: '.$query );
}

function queryOapi($settings, $bbox, $query)
{
	error_log( __FUNCTION__.', bbox: '.$bbox.', query: '.$query );
}
