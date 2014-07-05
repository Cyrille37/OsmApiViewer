<?php

$xapi_providers = array(
'http://www.overpass-api.de/api/xapi?',
'http://api.openstreetmap.fr/xapi?',
'http://oapi-fr.openstreetmap.fr/xapi?',
'http://open.mapquestapi.com/xapi/api/0.6/'
);

//echo 'ok';
$settings = array(
	'xapi_url' => $xapi_providers[1],
	'oapi_url' => ''
);

$queryType = $_GET['qt'];
$query = $_GET['q'];
$bbox = $_GET['bb'];

$res = null ;
switch( $queryType )
{
	case 'xapi':
		$res = queryXapi($settings, $bbox, $query);
		break;
	case 'oapi':
		queryOapi($settings, $bbox, $query);
		break;
}

echo $res ;

function queryXapi($settings, $bbox, $query)
{
	error_log( __FUNCTION__.', bbox: '.$bbox.', query: '.$query );

	// node[amenity=pub][bbox=-77.041579,38.885851,-77.007247,38.900881]
	$url = $settings['xapi_url'].urlencode($query.'[bbox='.$bbox.']') ;
	$opts = array(
	  'http'=>array(
		'method'=>'GET',
		//'header'=>'Content-type: application/json'
		//'header'=>"Accept-language: en\r\n" .
		//		  "Cookie: foo=bar\r\n"
	  )
	);
	$context = stream_context_create($opts);
	$result = file_get_contents($url, false, $context);
	
	error_log('result: '.var_export($result,true));
	return $result;
}

function queryOapi($settings, $bbox, $query)
{
	error_log( __FUNCTION__.', bbox: '.$bbox.', query: '.$query );
}
