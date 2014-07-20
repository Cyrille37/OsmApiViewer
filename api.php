<?php
/**
 * #!/usr/bin/env php
 * http://docs.slimframework.com/
 * http://cacodaemon.de/index.php?id=48
 * http://www.androidhive.info/2014/01/how-to-create-rest-api-for-android-app-using-php-slim-and-mysql-day-12-2/
 **/
error_reporting(E_ALL);
date_default_timezone_set('Europe/Paris');

define('LIBS', __DIR__ . '/lib');
require LIBS . '/Slim/Slim/Slim.php';
\Slim\Slim::registerAutoloader();
require LIBS . '/idiorm/idiorm.php';

require LIBS . '/Util.php';
require LIBS . '/RestDB.php';

$app = new \Slim\Slim();
// $app->config('debug', false);

$db = new RestDB('sqlite:' . __DIR__ . '/osmapiviewer.sqlite');

$app->error(function (\Exception $e) use($app)
{
    error_log(var_export($e, true));
    $app->contentType('application/json; charset=utf-8');
    echo JsonResponse::Error($e);
});

$app->notFound(function () use($app)
{
    $app->contentType('application/json; charset=utf-8');
    echo JsonResponse::Error('Resource Not Found');
});

$app->get('/', function () use($app)
{
    $app->contentType('text/plain;charset=utf-8');
    echo 'Ok.';
});

$app->get('/ping', function () use($app)
{
    $app->contentType('application/json; charset=utf-8');
    echo JsonResponse::Ok();
});

/**
 * 
 */
$app->get('/install(/:fakedata)', function ($fakedata=null) use($app,$db)
{
    //$db->createSimpleKeysValueDB($fakedata);

    $sqls = array(
        'DROP TABLE IF EXISTS `queries` ;',
        'DROP TABLE IF EXISTS `maps` ;',
        'CREATE TABLE `maps` (
					`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
					`guid` VARCHAR(36) NOT NULL,
					`label` VARCHAR,
					`description` BLOG,
                    UNIQUE (`guid`)
				);',
        'CREATE TABLE `queries` (
					`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
					`maps_id` INTEGER NOT NULL,
					`label` VARCHAR,
					`description` VARCHAR,
					`query_type` VARCHAR,
					`query` BLOG,
					`marker_name` VARCHAR,
                    `marker_color` VARCHAR(7),
                    `cluster_color` VARCHAR(7),
                    FOREIGN KEY(maps_id) REFERENCES `maps`(id)
				);'
    );

    if (! empty($fakedata)) {
        $sql_fakedata = array(
        );
        $sqls = array_merge($sqls, $sql_fakedata);
    }
    
    ORM::get_db()->beginTransaction();
    foreach ($sqls as $sql) {
        error_log('EXEC : ' . $sql);
        ORM::get_db()->exec($sql);
    }
    ORM::get_db()->commit();
    
    $app->contentType('application/json; charset=utf-8');
    echo JsonResponse::Ok();
});

$app->hook(RestDB::HOOK_CREATE_BEFORE_SAVE, function ($tableName, $obj) use($app)
{
    switch ($tableName) {
        
        case 'groups':
            if (empty($group->guid))
                $group->guid = Util::guid();
            break;
    }
});

$db->registerRoutes($app);

$app->run();
