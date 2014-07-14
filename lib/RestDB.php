<?php
/**
 * Simple Rest & Json Database access.
 *
 * Require Idiorm to access data http://github.com/j4mie/idiorm
 * Require Slim framework http://slimframework.com
 * 
 * To interact with data before save use hooks (@see self::HOOK_*)
 * 
 * Some urls:
 * curl -i -H "Accept: application/json" -X GET http://website/some.php/db/table/id
 * curl -i -H "Accept: application/json" -X GET http://website/some.php/db/table/field/value
 * curl -i -H "Accept: application/json" -X GET http://website/some.php/db/table/field/value/childrenTable
 * curl -i -H "Accept: application/json" -X POST -d "label=bla bla bla" http://website/some.php/db/table
 * curl -i -H "Accept: application/json" -X PUT -d "label=bla bla bla" http://website/some.php/db/table/id
 * 
 */
if (! class_exists('ORM'))
    die('Require idiorm from http://github.com/j4mie/idiorm');
if (! class_exists('\Slim\Slim'))
    die('Require Slim framework from http://slimframework.com');

class RestDB
{

    const HTTP_CONTENT_TYPE = 'application/json; charset=utf-8';

    const HOOK_CREATE_BEFORE_SAVE = 'restdb.create.before.save';

    const HOOK_UPDATE_BEFORE_SAVE = 'restdb.update.before.save';

    const HOOK_RESTDB_BEFORE_DELETE = 'restdb.before.delete';

    public function __construct($dsn, $user = null, $password = null)
    {
        // ORM::configure('sqlite:' . __DIR__ . '/osmapiviewer.sqlite');
        if ($user != null)
            ORM::configure($dsn, $user, $password);
        else
            ORM::configure($dsn);
        ORM::configure('error_mode', PDO::ERRMODE_EXCEPTION);
        ORM::configure('return_result_sets', true); // returns result sets
    }

    public function registerRoutes(\Slim\Slim $app)
    {
        /**
         * Retreive groups
         */
        $app->get('/db/:tableName(/:field)(/:fieldValue)(/:childrenTable)', function ($tableName, $field = null, $fieldValue = null, $childrenTable = null) use($app)
        {
            $result = null;
            if ($childrenTable != null) {
                $result = ORM::for_table($tableName)->where($tableName . '.' . $field, $fieldValue)
                    ->join($childrenTable, array(
                    $tableName . '.id',
                    '=',
                    $childrenTable . '.' . $tableName . '_id'
                ))
                    ->findArray();
            } elseif ($fieldValue != null) {
                $result = ORM::for_table($tableName)->where($field, $fieldValue)
                    ->findArray();
            } elseif ($field != null) {
                $result = ORM::for_table($tableName)->findOne($field)
                    ->asArray();
            } else {
                $result = ORM::forTable($tableName)->findArray();
            }
            $app->contentType(self::HTTP_CONTENT_TYPE);
            echo JsonResponse::Ok($result);
        });
        
        /**
         * Create a group
         */
        $app->post('/db/:tableName', function ($tableName) use($app)
        {
            ORM::get_db()->beginTransaction();
            
            $obj = ORM::forTable($tableName)->create();
            
            foreach ($app->request->post() as $k => $v) {
                $obj->$k = $v;
            }
            
            $app->applyHook(self::HOOK_CREATE_BEFORE_SAVE, $tableName, $obj);
            $obj->save();
            ORM::get_db()->commit();
            
            $app->contentType(self::HTTP_CONTENT_TYPE);
            echo JsonResponse::Ok($obj->asArray());
        });
        
        /**
         * Update a group
         */
        $app->put('/db/:tableName/:id', function ($tableName, $id) use($app)
        {
            ORM::get_db()->beginTransaction();
            
            $obj = ORM::forTable($tableName)->findOne($id);
            if ($obj === false) {
                $app->notFound();
            }
            foreach ($app->request->post() as $k => $v) {
                $obj->$k = $v;
            }
            
            $app->applyHook(self::HOOK_UPDATE_BEFORE_SAVE, $tableName, $obj);
            $obj->save();
            ORM::get_db()->commit();
            
            $app->contentType(self::HTTP_CONTENT_TYPE);
            echo JsonResponse::Ok($obj->asArray());
        });
        
        /**
         * Delete a group
         */
        $app->delete('/db/:tableName/:id', function ($tableName, $id) use($app)
        {
            ORM::get_db()->beginTransaction();
            
            $group = ORM::forTable($tableName)->findOne($id);
            if ($group === false) {
                $app->notFound();
            }
            
            $app->applyHook(self::HOOK_RESTDB_BEFORE_DELETE, $tableName, $obj);
            $group->delete();
            ORM::get_db()->commit();
            
            $app->contentType(self::HTTP_CONTENT_TYPE);
            echo JsonResponse::Ok();
        });
    }
}
